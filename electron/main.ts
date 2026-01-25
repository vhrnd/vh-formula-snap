import { app, BrowserWindow, ipcMain, clipboard, desktopCapturer, screen, globalShortcut, Tray, Menu, nativeImage } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

// pending capture result to send when window is recreated
let pendingCaptureImage: string | null = null;
let mainWindow: BrowserWindow | null = null;
let captureWindows: BrowserWindow[] = [];
let tray: Tray | null = null;

// Base64 PNG for the tray icon (larger than a 16x16 dot).
const TRAY_ICON_BASE64 = process.platform === 'darwin'
    ? 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAADFJREFUOE9jZGBg+M+AG3Boxg0D/x81gG4IqW6AATQ+I82G7tHwYBgw/GfADRgY0jAAAMwXEQWjZJ2VAAAAAElFTkSuQmCC'
    : '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';

function ensureMainWindow() {
    if (!mainWindow || mainWindow.isDestroyed()) {
        createWindow();
    } else {
        if (!mainWindow.isVisible()) {
            mainWindow.show();
        }
        if (mainWindow.isMinimized()) {
            mainWindow.restore();
        }
        mainWindow.focus();
    }
}

function resolveWindowIconPath(): string | undefined {
    if (process.platform !== 'win32') {
        return undefined;
    }

    const iconName = 'icon.ico';
    const devPath = path.join(process.cwd(), 'build', iconName);
    const prodPath = path.join(process.resourcesPath, iconName);
    const candidate = app.isPackaged ? prodPath : devPath;

    return fs.existsSync(candidate) ? candidate : undefined;
}

function createTray() {
    const icon = nativeImage.createFromDataURL(`data:image/png;base64,${TRAY_ICON_BASE64}`);
    tray = new Tray(icon);

    tray.setToolTip('FormulaSnap');
    tray.setTitle(' FS');

    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Chụp màn hình',
            click: async () => {
                await startCaptureFlow();
            }
        },
        {
            label: 'Hiện ứng dụng',
            click: () => {
                ensureMainWindow();
            }
        },
        { type: 'separator' },
        {
            label: 'Thoát',
            click: () => {
                app.quit();
            }
        }
    ]);

    tray.setContextMenu(contextMenu);


}

function createWindow() {
    const windowIconPath = resolveWindowIconPath();
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 900,
        minHeight: 600,
        backgroundColor: '#F8F9FD',
        titleBarStyle: 'hiddenInset',
        autoHideMenuBar: true,
        ...(windowIconPath ? { icon: windowIconPath } : {}),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    if (process.env.NODE_ENV === 'development') {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Handle pending capture result if window was recreated
    mainWindow.webContents.on('did-finish-load', () => {
        if (pendingCaptureImage && mainWindow) {
            mainWindow.webContents.send('capture-result', pendingCaptureImage);
            pendingCaptureImage = null;
        }
    });
}

function closeCaptureWindows() {
    captureWindows.forEach(win => {
        if (!win.isDestroyed()) {
            win.close();
        }
    });
    captureWindows = [];
}

function createCaptureOverlay(): Promise<void> {
    return new Promise((resolve) => {
        const displays = screen.getAllDisplays();
        closeCaptureWindows();

        const promises = displays.map(display => {
            return new Promise<void>((resolveDisplay) => {
                const { x, y, width, height } = display.bounds;

                const win = new BrowserWindow({
                    x, y, width, height,
                    transparent: true,
                    frame: false,
                    alwaysOnTop: true,
                    skipTaskbar: true,
                    resizable: false,
                    movable: false,
                    hasShadow: false,
                    enableLargerThanScreen: true,
                    show: false, // Don't show immediately
                    webPreferences: {
                        preload: path.join(__dirname, 'preload.js'),
                        contextIsolation: true,
                        nodeIntegration: false,
                    },
                });

                // macOS specific handling for overlays
                if (process.platform === 'darwin') {
                    // Start with simpleFullScreen
                    win.setSimpleFullScreen(true);
                    // Crucial for multi-monitor overlay to not switch spaces
                    win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
                } else {
                    win.setFullScreen(true);
                }

                // Ensure it's on top of everything including menu bar
                win.setAlwaysOnTop(true, 'screen-saver', 1);

                captureWindows.push(win);

                const url = process.env.NODE_ENV === 'development'
                    ? `http://localhost:5173/capture.html?displayId=${display.id}`
                    : `file://${path.join(__dirname, '../dist/capture.html')}?displayId=${display.id}`;

                win.loadURL(url);

                win.once('ready-to-show', () => {
                    win.show();
                    resolveDisplay();
                });
            });
        });

        Promise.all(promises).then(() => {
            // Intelligent Focus: Focus the window where the mouse is
            const cursorPoint = screen.getCursorScreenPoint();
            const nearestDisplay = screen.getDisplayNearestPoint(cursorPoint);

            // Find window corresponding to this display
            // We can match by bounds logic roughly
            const focusWin = captureWindows.find(w => {
                const bounds = w.getBounds();
                return bounds.x === nearestDisplay.bounds.x && bounds.y === nearestDisplay.bounds.y;
            });

            if (focusWin) {
                // setTimeout ensures it processes after show() events
                setTimeout(() => {
                    focusWin.focus();
                }, 50);
            }

            resolve();
        });
    });
}

async function startCaptureFlow(): Promise<{ success: boolean; error?: string }> {
    try {
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.hide();
        }
        await createCaptureOverlay();
        return { success: true };
    } catch (error) {
        ensureMainWindow();
        return { success: false, error: String(error) };
    }
}

function registerGlobalShortcuts() {
    const shortcut = process.platform === 'darwin' ? 'Command+Shift+S' : 'Ctrl+Shift+S';
    globalShortcut.register(shortcut, async () => {
        if (captureWindows.length > 0) return;
        await startCaptureFlow();
    });

    const altShortcut = process.platform === 'darwin' ? 'Control+Shift+S' : 'Alt+Shift+S';
    globalShortcut.register(altShortcut, async () => {
        if (captureWindows.length > 0) return;
        await startCaptureFlow();
    });
}

app.commandLine.appendSwitch("enable-unsafe-webgpu");

app.whenReady().then(() => {
    createWindow();
    createTray();
    registerGlobalShortcuts();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        // app.quit();
    }
});

// IPC handlers
ipcMain.handle('copy-to-clipboard', async (_event, text: string) => {
    clipboard.writeText(text);
    return true;
});

ipcMain.handle('start-capture', async () => {
    return startCaptureFlow();
});

ipcMain.handle('hide-overlay-for-capture', async () => {
    captureWindows.forEach(win => win.hide());
    await new Promise(resolve => setTimeout(resolve, 100));
    return { success: true };
});

ipcMain.handle('capture-screen-now', async (_event, displayId: number) => {
    const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: { width: 4000, height: 4000 },
    });

    if (sources.length === 0) {
        return { success: false, error: 'No screen sources' };
    }

    let source = sources.find(s => s.display_id === String(displayId));
    if (!source) {
        source = sources[0];
    }

    const display = screen.getAllDisplays().find(d => d.id === displayId) || screen.getPrimaryDisplay();

    return {
        success: true,
        imageDataUrl: source.thumbnail.toDataURL(),
        displaySize: display.size
    };
});

ipcMain.handle('capture-complete', async (_event, imageDataUrl: string) => {
    closeCaptureWindows();

    if (!mainWindow || mainWindow.isDestroyed()) {
        pendingCaptureImage = imageDataUrl;
        createWindow();
        // mainWindow will send event when loaded via did-finish-load
    } else {
        ensureMainWindow();
        mainWindow.webContents.send('capture-result', imageDataUrl);
    }

    return { success: true, imageDataUrl };
});

ipcMain.handle('capture-cancel', async () => {
    closeCaptureWindows();
    ensureMainWindow();
    mainWindow?.webContents.send('capture-cancelled');
    return { success: true };
});

ipcMain.handle('get-display-size', () => {
    const primaryDisplay = screen.getPrimaryDisplay();
    return primaryDisplay.size;
});
