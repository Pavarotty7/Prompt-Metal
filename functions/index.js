const { onRequest } = require("firebase-functions/v2/https");
const express = require("express");
const cookieParser = require("cookie-parser");
const { google } = require("googleapis");
const admin = require("firebase-admin");

if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

const app = express();

app.set("trust proxy", 1);
app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());

const APP_URL = process.env.APP_URL || "https://prompt-metal.web.app";
const IS_HTTPS_APP = APP_URL.startsWith("https://");

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${APP_URL}/auth/google/callback`
);

function getRequestAppUrl(req) {
    const forwardedProto = String(req.headers["x-forwarded-proto"] || "").split(",")[0].trim();
    const forwardedHost = String(req.headers["x-forwarded-host"] || "").split(",")[0].trim();
    const host = forwardedHost || req.get("host") || "";
    const protocol = forwardedProto || req.protocol || (IS_HTTPS_APP ? "https" : "http");

    if (!host) {
        return APP_URL;
    }

    return `${protocol}://${host}`;
}

function createOAuthClient(req) {
    const requestAppUrl = getRequestAppUrl(req);

    return new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `${requestAppUrl}/auth/google/callback`
    );
}

const SCOPES = [
    "openid",
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/drive.metadata.readonly",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
];

function requireOAuthEnv(res) {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        res.status(500).json({
            error: "Google OAuth não configurado. Defina GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET nas Functions.",
        });
        return false;
    }
    return true;
}

function getDriveClient(refreshToken) {
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    return google.drive({ version: "v3", auth: oauth2Client });
}

async function getAuthenticatedUserEmail(refreshToken, accessToken) {
    oauth2Client.setCredentials(
        refreshToken
            ? { refresh_token: refreshToken }
            : { access_token: accessToken }
    );
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const { data } = await oauth2.userinfo.get();

    if (!data?.email) {
        throw new Error("Não foi possível identificar o usuário Google autenticado.");
    }

    return String(data.email).toLowerCase();
}

function normalizeUserId(value) {
    return String(value || "").trim().toLowerCase();
}

async function resolveFirestoreUserId(req) {
    const refreshToken = req.cookies.google_refresh_token;
    const accessToken = req.cookies.google_access_token;
    if (refreshToken || accessToken) {
        return await getAuthenticatedUserEmail(refreshToken, accessToken);
    }

    const fallbackUserId = normalizeUserId(req.body?.userId || req.query?.userId);
    if (!fallbackUserId) {
        return "";
    }

    return fallbackUserId;
}

function cookieOptions() {
    return {
        httpOnly: true,
        secure: IS_HTTPS_APP,
        sameSite: IS_HTTPS_APP ? "none" : "lax",
        path: "/",
        maxAge: 30 * 24 * 60 * 60 * 1000,
    };
}

function accessTokenCookieOptions(expiresAtMs) {
    const now = Date.now();
    const maxAge = Number(expiresAtMs)
        ? Math.max(60 * 1000, Number(expiresAtMs) - now)
        : 60 * 60 * 1000;

    return {
        httpOnly: true,
        secure: IS_HTTPS_APP,
        sameSite: IS_HTTPS_APP ? "none" : "lax",
        path: "/",
        maxAge,
    };
}

app.get("/api/auth/google/url", (req, res) => {
    if (!requireOAuthEnv(res)) return;

    const authClient = createOAuthClient(req);

    const url = authClient.generateAuthUrl({
        access_type: "offline",
        scope: SCOPES,
        prompt: "consent",
    });

    res.json({ url });
});

app.get("/auth/google/callback", async (req, res) => {
    if (!requireOAuthEnv(res)) return;

    const { code } = req.query;
    if (!code) {
        return res.status(400).send("Código OAuth ausente.");
    }

    try {
        const authClient = createOAuthClient(req);
        const { tokens } = await authClient.getToken(code);

        if (tokens.access_token) {
            res.cookie("google_access_token", tokens.access_token, accessTokenCookieOptions(tokens.expiry_date));
        }

        if (tokens.refresh_token) {
            res.cookie("google_refresh_token", tokens.refresh_token, cookieOptions());
        }

        if (!tokens.refresh_token && !tokens.access_token) {
            return res.send(`
            <html>
                <body>
                    <script>
                        if (window.opener) {
                            window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', message: 'Google não retornou token de autenticação.' }, '*');
                            window.close();
                        } else {
                            window.location.href = '/';
                        }
                    </script>
                    <p>Falha ao concluir autenticação. O Google não retornou token.</p>
                </body>
            </html>
        `);
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
        const email = await getAuthenticatedUserEmail(refreshToken, accessToken);
        res.json({ connected: true, email });
    } catch (error) {
        console.error("User info error:", error);
        res.status(500).json({ error: "Não foi possível obter dados do usuário Google" });
    }
});

app.post("/api/auth/google/logout", (req, res) => {
    res.clearCookie("google_refresh_token", {
        httpOnly: true,
        secure: IS_HTTPS_APP,
        sameSite: IS_HTTPS_APP ? "none" : "lax",
        path: "/",
    });
    res.clearCookie("google_access_token", {
        httpOnly: true,
        secure: IS_HTTPS_APP,
        sameSite: IS_HTTPS_APP ? "none" : "lax",
        path: "/",
    });
    res.json({ success: true });
});

app.post("/api/drive/backup", async (req, res) => {
    const refreshToken = req.cookies.google_refresh_token;
    if (!refreshToken) {
        return res.status(401).json({ error: "Not connected to Google Drive" });
    }

    try {
        const drive = getDriveClient(refreshToken);
        const { data, filename } = req.body;

        let folderId = "";
        const folderSearch = await drive.files.list({
            q: "name = 'PromptMetal Backups' and mimeType = 'application/vnd.google-apps.folder' and trashed = false",
            fields: "files(id)",
        });

        if (folderSearch.data.files && folderSearch.data.files.length > 0) {
            folderId = folderSearch.data.files[0].id;
        } else {
            const folder = await drive.files.create({
                requestBody: {
                    name: "PromptMetal Backups",
                    mimeType: "application/vnd.google-apps.folder",
                },
                fields: "id",
            });
            folderId = folder.data.id;
        }

        await drive.files.create({
            requestBody: {
                name: filename || `backup_${new Date().toISOString()}.json`,
                parents: [folderId],
            },
            media: {
                mimeType: "application/json",
                body: JSON.stringify(data),
            },
            fields: "id",
        });

        const backupsList = await drive.files.list({
            q: `'${folderId}' in parents and trashed = false`,
            orderBy: "createdTime desc",
            fields: "files(id, name, createdTime)",
        });

        if (backupsList.data.files && backupsList.data.files.length > 3) {
            const toDelete = backupsList.data.files.slice(3);
            for (const file of toDelete) {
                if (file.id) {
                    await drive.files.delete({ fileId: file.id });
                }
            }
        }

        res.json({ success: true, history: backupsList.data.files?.slice(0, 3) || [] });
    } catch (error) {
        console.error("Backup error:", error);
        res.status(500).json({ error: "Erro ao realizar backup no Google Drive" });
    }
});

app.get("/api/drive/history", async (req, res) => {
    const refreshToken = req.cookies.google_refresh_token;
    if (!refreshToken) {
        return res.status(401).json({ error: "Not connected" });
    }

    try {
        const drive = getDriveClient(refreshToken);

        const folderSearch = await drive.files.list({
            q: "name = 'PromptMetal Backups' and mimeType = 'application/vnd.google-apps.folder' and trashed = false",
            fields: "files(id)",
        });

        if (!folderSearch.data.files || folderSearch.data.files.length === 0) {
            return res.json({ history: [] });
        }

        const folderId = folderSearch.data.files[0].id;
        const backupsList = await drive.files.list({
            q: `'${folderId}' in parents and trashed = false`,
            orderBy: "createdTime desc",
            fields: "files(id, name, createdTime)",
        });

        res.json({ history: backupsList.data.files?.slice(0, 3) || [] });
    } catch (error) {
        console.error("History error:", error);
        res.status(500).json({ error: "Erro ao buscar histórico" });
    }
});

app.post("/api/drive/upload-file", async (req, res) => {
    const refreshToken = req.cookies.google_refresh_token;
    if (!refreshToken) {
        return res.status(401).json({ error: "Not connected" });
    }

    try {
        const drive = getDriveClient(refreshToken);
        const { name, mimeType, content, folderName = "PromptMetal Documents" } = req.body;

        let folderId = "";
        const folderSearch = await drive.files.list({
            q: `name = '${String(folderName).replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
            fields: "files(id)",
        });

        if (folderSearch.data.files && folderSearch.data.files.length > 0) {
            folderId = folderSearch.data.files[0].id;
        } else {
            const folder = await drive.files.create({
                requestBody: {
                    name: folderName,
                    mimeType: "application/vnd.google-apps.folder",
                },
                fields: "id",
            });
            folderId = folder.data.id;
        }

        const file = await drive.files.create({
            requestBody: { name, parents: [folderId] },
            media: {
                mimeType,
                body: Buffer.from(content, "base64"),
            },
            fields: "id, webViewLink",
        });

        res.json({ success: true, fileId: file.data.id, url: file.data.webViewLink });
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ error: "Erro ao enviar arquivo para o Drive" });
    }
});

app.get("/api/data/load", async (req, res) => {
    try {
        const userId = await resolveFirestoreUserId(req);
        if (!userId) {
            return res.status(401).json({ error: "Usuário não autenticado para carregar dados" });
        }

        const docRef = db.collection("promptmetalUsers").doc(userId);
        const snapshot = await docRef.get();

        if (!snapshot.exists) {
            return res.json({ success: true, data: null });
        }

        const payload = snapshot.data();
        res.json({ success: true, data: payload?.data || null });
    } catch (error) {
        console.error("Cloud load error:", error);
        res.status(500).json({ error: "Erro ao carregar dados da nuvem" });
    }
});

app.post("/api/data/save", async (req, res) => {
    try {
        const userId = await resolveFirestoreUserId(req);
        if (!userId) {
            return res.status(401).json({ error: "Usuário não autenticado para salvar dados" });
        }

        const { data } = req.body;

        if (!data) {
            return res.status(400).json({ error: "Payload de dados ausente" });
        }

        await db.collection("promptmetalUsers").doc(userId).set(
            {
                data,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
        );

        res.json({ success: true });
    } catch (error) {
        console.error("Cloud save error:", error);
        res.status(500).json({ error: "Erro ao salvar dados na nuvem" });
    }
});

exports.api = onRequest(
    {
        region: "us-central1",
        invoker: "public",
        memory: "512MiB",
        timeoutSeconds: 120,
        secrets: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
    },
    app
);
