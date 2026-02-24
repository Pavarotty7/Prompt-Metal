const express = require('express');
const { google } = require('googleapis');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.APP_URL || `http://localhost:${PORT}`}/auth/google/callback`
);

const SCOPES = [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/drive.metadata.readonly',
];

app.get('/api/auth/google/url', (req, res) => {
    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        prompt: 'consent',
    });

    res.json({ url });
});

app.get('/auth/google/callback', async (req, res) => {
    const { code } = req.query;

    try {
        const { tokens } = await oauth2Client.getToken(code);

        if (tokens.refresh_token) {
            res.cookie('google_refresh_token', tokens.refresh_token, {
                httpOnly: true,
                secure: true,
                sameSite: 'none',
                maxAge: 30 * 24 * 60 * 60 * 1000,
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
        console.error('Error exchanging code for tokens:', error);
        res.status(500).send('Erro na autenticação.');
    }
});

app.get('/api/auth/google/status', (req, res) => {
    const refreshToken = req.cookies.google_refresh_token;
    res.json({ connected: !!refreshToken });
});

app.post('/api/auth/google/logout', (req, res) => {
    res.clearCookie('google_refresh_token', {
        secure: true,
        sameSite: 'none',
    });
    res.json({ success: true });
});

app.post('/api/drive/backup', async (req, res) => {
    const refreshToken = req.cookies.google_refresh_token;
    if (!refreshToken) return res.status(401).json({ error: 'Not connected to Google Drive' });

    try {
        oauth2Client.setCredentials({ refresh_token: refreshToken });
        const drive = google.drive({ version: 'v3', auth: oauth2Client });

        const { data, filename } = req.body;

        let folderId = '';
        const folderSearch = await drive.files.list({
            q: "name = 'PromptMetal Backups' and mimeType = 'application/vnd.google-apps.folder' and trashed = false",
            fields: 'files(id)',
        });

        if (folderSearch.data.files && folderSearch.data.files.length > 0) {
            folderId = folderSearch.data.files[0].id;
        } else {
            const folderMetadata = {
                name: 'PromptMetal Backups',
                mimeType: 'application/vnd.google-apps.folder',
            };
            const folder = await drive.files.create({
                requestBody: folderMetadata,
                fields: 'id',
            });
            folderId = folder.data.id;
        }

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
            media,
            fields: 'id',
        });

        const backupsList = await drive.files.list({
            q: `'${folderId}' in parents and trashed = false`,
            orderBy: 'createdTime desc',
            fields: 'files(id, name, createdTime)',
        });

        if (backupsList.data.files && backupsList.data.files.length > 3) {
            const toDelete = backupsList.data.files.slice(3);
            for (const file of toDelete) {
                await drive.files.delete({ fileId: file.id });
            }
        }

        res.json({ success: true, history: backupsList.data.files?.slice(0, 3) });
    } catch (error) {
        console.error('Backup error:', error);
        res.status(500).json({ error: 'Erro ao realizar backup no Google Drive' });
    }
});

app.post('/api/drive/upload-file', async (req, res) => {
    const refreshToken = req.cookies.google_refresh_token;
    if (!refreshToken) return res.status(401).json({ error: 'Not connected' });

    try {
        oauth2Client.setCredentials({ refresh_token: refreshToken });
        const drive = google.drive({ version: 'v3', auth: oauth2Client });

        const { name, mimeType, content, folderName = 'PromptMetal Documents' } = req.body;

        let folderId = '';
        const folderSearch = await drive.files.list({
            q: `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
            fields: 'files(id)',
        });

        if (folderSearch.data.files && folderSearch.data.files.length > 0) {
            folderId = folderSearch.data.files[0].id;
        } else {
            const folder = await drive.files.create({
                requestBody: { name: folderName, mimeType: 'application/vnd.google-apps.folder' },
                fields: 'id',
            });
            folderId = folder.data.id;
        }

        const fileMetadata = { name, parents: [folderId] };
        const media = {
            mimeType,
            body: Buffer.from(content, 'base64'),
        };

        const file = await drive.files.create({
            requestBody: fileMetadata,
            media,
            fields: 'id, webViewLink',
        });

        res.json({ success: true, fileId: file.data.id, url: file.data.webViewLink });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Erro ao enviar arquivo para o Drive' });
    }
});

app.get('/api/drive/history', async (req, res) => {
    const refreshToken = req.cookies.google_refresh_token;
    if (!refreshToken) return res.status(401).json({ error: 'Not connected' });

    try {
        oauth2Client.setCredentials({ refresh_token: refreshToken });
        const drive = google.drive({ version: 'v3', auth: oauth2Client });

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
        res.status(500).json({ error: 'Erro ao buscar histórico' });
    }
});

const appDistPath = path.join(process.resourcesPath, 'app.asar', 'dist');
app.use(express.static(appDistPath));
app.use((req, res) => {
    res.sendFile(path.join(appDistPath, 'index.html'));
});

app.listen(PORT, '127.0.0.1', () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
