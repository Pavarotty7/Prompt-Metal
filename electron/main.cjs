const { app, BrowserWindow, shell } = require('electron');
const { spawn, fork } = require('child_process');
const path = require('path');
const net = require('net');

const PORT = 3000;
const HOST = '127.0.0.1';
const STARTUP_TIMEOUT_MS = 30000;

let serverProcess = null;
let mainWindow = null;

function waitForPort(port, host, timeoutMs) {
    return new Promise((resolve, reject) => {
        const start = Date.now();

        const check = () => {
            const socket = new net.Socket();
            socket.setTimeout(1000);

            socket
                .once('connect', () => {
                    socket.destroy();
                    resolve();
                })
                .once('timeout', () => {
                    socket.destroy();
                    retry();
                })
                .once('error', () => {
                    socket.destroy();
                    retry();
                })
                .connect(port, host);
        };

        const retry = () => {
            if (Date.now() - start > timeoutMs) {
                reject(new Error(`Servidor não respondeu em ${timeoutMs}ms na porta ${port}.`));
                return;
            }
            setTimeout(check, 250);
        };

        check();
    });
}

function startServer() {
    if (app.isPackaged) {
        const serverScript = path.join(app.getAppPath(), 'electron', 'server.cjs');
        serverProcess = fork(serverScript, {
            env: {
                ...process.env,
                NODE_ENV: 'production',
                APP_URL: process.env.APP_URL || `http://localhost:${PORT}`,
                PORT: String(PORT),
                ELECTRON_RUN_AS_NODE: '1',
            },
            stdio: 'inherit',
        });
    } else {
        const npmCmd = 'npm';
        serverProcess = spawn(npmCmd, ['run', 'dev'], {
            cwd: path.join(__dirname, '..'),
            env: {
                ...process.env,
                NODE_ENV: process.env.NODE_ENV || 'development',
                APP_URL: process.env.APP_URL || `http://localhost:${PORT}`,
                PORT: String(PORT),
            },
            stdio: 'inherit',
            shell: true,
        });
    }

    serverProcess.on('exit', (code) => {
        if (code !== 0) {
            console.error(`Processo do servidor finalizou com código ${code}.`);
        }
    });
}

function stopServer() {
    if (!serverProcess || serverProcess.killed) {
        return;
    }

    serverProcess.kill();
    serverProcess = null;
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 820,
        minWidth: 800,
        minHeight: 600,
        resizable: true,
        maximizable: true,
        fullscreen: false,
        fullscreenable: true,
        useContentSize: true,
        show: false,
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
        },
    });

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    mainWindow.once('ready-to-show', () => {
        if (mainWindow && mainWindow.isMaximized()) {
            mainWindow.unmaximize();
        }
        if (mainWindow && mainWindow.isFullScreen()) {
            mainWindow.setFullScreen(false);
        }
        mainWindow?.show();
    });

    mainWindow.loadURL(`http://localhost:${PORT}`);
}

app.whenReady().then(async () => {
    startServer();

    try {
        await waitForPort(PORT, HOST, STARTUP_TIMEOUT_MS);
        createWindow();
    } catch (error) {
        console.error(error);
        app.quit();
    }

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('before-quit', () => {
    stopServer();
});

process.on('exit', () => {
    stopServer();
});
