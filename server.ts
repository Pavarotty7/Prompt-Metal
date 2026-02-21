import express from 'express';
import { createServer as createViteServer } from 'vite';
import { google } from 'googleapis';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(cookieParser());

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    // Redirect URI will be constructed dynamically in the routes
  );

  const getRedirectUri = (req: express.Request) => {
    // Use APP_URL if available, otherwise fallback to host header
    const origin = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    return `${origin}/api/auth/google/callback`;
  };

  // --- Google OAuth Routes ---

  app.get('/api/auth/google/url', (req, res) => {
    const redirectUri = getRedirectUri(req);
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/drive.file'],
      redirect_uri: redirectUri,
      prompt: 'consent'
    });
    res.json({ url });
  });

  app.get('/api/auth/google/callback', async (req, res) => {
    const { code } = req.query;
    const redirectUri = getRedirectUri(req);

    try {
      const { tokens } = await oauth2Client.getToken({
        code: code as string,
        redirect_uri: redirectUri
      });
      
      // Store tokens in a secure cookie
      res.cookie('google_tokens', JSON.stringify(tokens), {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });

      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS' }, '*');
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
      console.error('Error exchanging code for tokens:', error);
      res.status(500).send('Erro na autenticação com o Google.');
    }
  });

  app.get('/api/auth/google/status', (req, res) => {
    const tokens = req.cookies.google_tokens;
    res.json({ isAuthenticated: !!tokens });
  });

  app.post('/api/auth/google/logout', (req, res) => {
    res.clearCookie('google_tokens', {
      httpOnly: true,
      secure: true,
      sameSite: 'none'
    });
    res.json({ success: true });
  });

  // --- Google Drive Backup Routes ---

  app.post('/api/drive/backup', async (req, res) => {
    const tokensStr = req.cookies.google_tokens;
    if (!tokensStr) {
      return res.status(401).json({ error: 'Não autenticado com o Google' });
    }

    const tokens = JSON.parse(tokensStr);
    oauth2Client.setCredentials(tokens);
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    try {
      const data = req.body;
      const fileName = `promptmetal_backup_${new Date().toISOString().split('T')[0]}.json`;

      // Search for existing backup file to update or create new
      const response = await drive.files.list({
        q: "name = 'promptmetal_backup.json' and trashed = false",
        spaces: 'drive',
        fields: 'files(id, name)',
      });

      const existingFile = response.data.files?.[0];

      if (existingFile) {
        // Update existing file
        await drive.files.update({
          fileId: existingFile.id!,
          media: {
            mimeType: 'application/json',
            body: JSON.stringify(data, null, 2),
          },
        });
      } else {
        // Create new file
        await drive.files.create({
          requestBody: {
            name: 'promptmetal_backup.json',
            mimeType: 'application/json',
          },
          media: {
            mimeType: 'application/json',
            body: JSON.stringify(data, null, 2),
          },
        });
      }

      res.json({ success: true, message: 'Backup realizado com sucesso no Google Drive!' });
    } catch (error) {
      console.error('Error backing up to Drive:', error);
      res.status(500).json({ error: 'Erro ao realizar backup no Google Drive' });
    }
  });

  app.get('/api/drive/restore', async (req, res) => {
    const tokensStr = req.cookies.google_tokens;
    if (!tokensStr) {
      return res.status(401).json({ error: 'Não autenticado com o Google' });
    }

    const tokens = JSON.parse(tokensStr);
    oauth2Client.setCredentials(tokens);
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    try {
      const response = await drive.files.list({
        q: "name = 'promptmetal_backup.json' and trashed = false",
        spaces: 'drive',
        fields: 'files(id, name)',
      });

      const file = response.data.files?.[0];

      if (!file) {
        return res.status(404).json({ error: 'Nenhum backup encontrado no Google Drive.' });
      }

      const fileContent = await drive.files.get({
        fileId: file.id!,
        alt: 'media',
      });

      res.json(fileContent.data);
    } catch (error) {
      console.error('Error restoring from Drive:', error);
      res.status(500).json({ error: 'Erro ao buscar backup do Google Drive' });
    }
  });

  // --- Vite Middleware ---

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
