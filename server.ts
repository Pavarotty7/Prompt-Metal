import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import { google } from "googleapis";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT || 3000);
const APP_URL = process.env.APP_URL || `http://localhost:${PORT}`;
const isProduction = process.env.NODE_ENV === "production";

app.set("trust proxy", 1);

app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${APP_URL}/auth/google/callback`
);

const SCOPES = [
  'openid',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.metadata.readonly'
];

const createAuthorizedOAuthClient = (refreshToken?: string, accessToken?: string) => {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${APP_URL}/auth/google/callback`
  );

  if (refreshToken) {
    client.setCredentials({ refresh_token: refreshToken });
    return client;
  }

  if (accessToken) {
    client.setCredentials({ access_token: accessToken });
    return client;
  }

  return null;
};

// Auth Routes
app.get("/api/auth/google/url", (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(500).json({
      error: "Google OAuth não configurado. Defina GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET."
    });
  }

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });
  res.json({ url });
});

app.get("/auth/google/callback", async (req, res) => {
  const { code } = req.query;
  try {
    const { tokens } = await oauth2Client.getToken(code as string);

    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' as const : 'lax' as const,
    };

    if (tokens.access_token) {
      const expiresInMs = Number(tokens.expiry_date)
        ? Math.max(60_000, Number(tokens.expiry_date) - Date.now())
        : 60 * 60 * 1000;

      res.cookie('google_access_token', tokens.access_token, {
        ...cookieOptions,
        maxAge: expiresInMs,
      });
    }

    // Store refresh token in a secure cookie
    if (tokens.refresh_token) {
      res.cookie('google_refresh_token', tokens.refresh_token, {
        ...cookieOptions,
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });
    }

    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Autenticação concluída com sucesso. Esta janela fechará automaticamente.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("Error exchanging code for tokens:", error);
    res.status(500).send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', message: 'Erro na autenticação com Google.' }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Falha na autenticação. Feche esta janela e tente novamente.</p>
        </body>
      </html>
    `);
  }
});

app.get("/api/auth/google/status", (req, res) => {
  const refreshToken = req.cookies.google_refresh_token;
  const accessToken = req.cookies.google_access_token;
  const connected = !!(refreshToken || accessToken);
  res.json({ connected, isAuthenticated: connected });
});

app.get("/api/auth/google/user", async (req, res) => {
  const refreshToken = req.cookies.google_refresh_token;
  const accessToken = req.cookies.google_access_token;

  if (!refreshToken && !accessToken) {
    return res.status(401).json({ error: "Sessão Google não encontrada" });
  }

  try {
    const authClient = createAuthorizedOAuthClient(refreshToken, accessToken);
    if (!authClient) {
      return res.status(401).json({ error: "Sessão Google não encontrada" });
    }

    const oauth2 = google.oauth2({ version: 'v2', auth: authClient });
    const { data } = await oauth2.userinfo.get();

    const email = String(data?.email || '').trim().toLowerCase();
    if (!email) {
      return res.status(404).json({ error: "E-mail da conta Google não disponível" });
    }

    res.json({ email, name: data?.name || null, picture: data?.picture || null });
  } catch (error) {
    console.error("Erro ao obter dados do usuário Google:", error);
    res.status(500).json({ error: "Não foi possível obter dados do usuário Google" });
  }
});

app.post("/api/auth/google/logout", (req, res) => {
  res.clearCookie('google_refresh_token', {
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax'
  });
  res.clearCookie('google_access_token', {
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax'
  });
  res.json({ success: true });
});

// Google Drive Backup Routes
app.post("/api/drive/backup", async (req, res) => {
  const refreshToken = req.cookies.google_refresh_token;
  const accessToken = req.cookies.google_access_token;
  const authClient = createAuthorizedOAuthClient(refreshToken, accessToken);
  if (!authClient) return res.status(401).json({ error: "Not connected to Google Drive" });

  try {
    const drive = google.drive({ version: 'v3', auth: authClient });

    const { data, filename } = req.body;

    // 1. Find or create "PromptMetal Backups" folder
    let folderId = '';
    const folderSearch = await drive.files.list({
      q: "name = 'PromptMetal Backups' and mimeType = 'application/vnd.google-apps.folder' and trashed = false",
      fields: 'files(id)',
    });

    if (folderSearch.data.files && folderSearch.data.files.length > 0) {
      folderId = folderSearch.data.files[0].id!;
    } else {
      const folderMetadata = {
        name: 'PromptMetal Backups',
        mimeType: 'application/vnd.google-apps.folder',
      };
      const folder = await drive.files.create({
        requestBody: folderMetadata,
        fields: 'id',
      });
      folderId = folder.data.id!;
    }

    // 2. Upload backup file
    const fileMetadata = {
      name: filename || `backup_${new Date().toISOString()}.json`,
      parents: [folderId],
    };
    const media = {
      mimeType: 'application/json',
      body: JSON.stringify(data),
    };

    await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id',
    });

    // 3. Maintain only 3 backups
    const backupsList = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      orderBy: 'createdTime desc',
      fields: 'files(id, name, createdTime)',
    });

    if (backupsList.data.files && backupsList.data.files.length > 3) {
      const toDelete = backupsList.data.files.slice(3);
      for (const file of toDelete) {
        await drive.files.delete({ fileId: file.id! });
      }
    }

    res.json({ success: true, history: backupsList.data.files?.slice(0, 3) });
  } catch (error) {
    console.error("Backup error:", error);
    res.status(500).json({ error: "Erro ao realizar backup no Google Drive" });
  }
});

app.post("/api/drive/upload-file", async (req, res) => {
  const refreshToken = req.cookies.google_refresh_token;
  const accessToken = req.cookies.google_access_token;
  const authClient = createAuthorizedOAuthClient(refreshToken, accessToken);
  if (!authClient) return res.status(401).json({ error: "Not connected" });

  try {
    const drive = google.drive({ version: 'v3', auth: authClient });

    const { name, mimeType, content, folderName = 'PromptMetal Documents' } = req.body;

    // 1. Find or create folder
    let folderId = '';
    const folderSearch = await drive.files.list({
      q: `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: 'files(id)',
    });

    if (folderSearch.data.files && folderSearch.data.files.length > 0) {
      folderId = folderSearch.data.files[0].id!;
    } else {
      const folder = await drive.files.create({
        requestBody: { name: folderName, mimeType: 'application/vnd.google-apps.folder' },
        fields: 'id',
      });
      folderId = folder.data.id!;
    }

    // 2. Upload file
    const fileMetadata = { name, parents: [folderId] };
    const media = {
      mimeType: mimeType,
      body: Buffer.from(content, 'base64'),
    };

    const file = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, webViewLink',
    });

    res.json({ success: true, fileId: file.data.id, url: file.data.webViewLink });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Erro ao enviar arquivo para o Drive" });
  }
});

app.get("/api/drive/history", async (req, res) => {
  const refreshToken = req.cookies.google_refresh_token;
  const accessToken = req.cookies.google_access_token;
  const authClient = createAuthorizedOAuthClient(refreshToken, accessToken);
  if (!authClient) return res.status(401).json({ error: "Not connected" });

  try {
    const drive = google.drive({ version: 'v3', auth: authClient });

    const folderSearch = await drive.files.list({
      q: "name = 'PromptMetal Backups' and mimeType = 'application/vnd.google-apps.folder' and trashed = false",
      fields: 'files(id)',
    });

    if (!folderSearch.data.files || folderSearch.data.files.length === 0) {
      return res.json({ history: [] });
    }

    const folderId = folderSearch.data.files[0].id;
    const backupsList = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      orderBy: 'createdTime desc',
      fields: 'files(id, name, createdTime)',
    });

    res.json({ history: backupsList.data.files?.slice(0, 3) || [] });
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar histórico" });
  }
});

// Vite middleware for development
if (process.env.NODE_ENV !== "production") {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.join(__dirname, "dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
