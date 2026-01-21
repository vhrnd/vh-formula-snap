import { app, BrowserWindow, ipcMain, clipboard, desktopCapturer, screen, globalShortcut, Tray, Menu, nativeImage } from 'electron';
import * as path from 'path';

// pending capture result to send when window is recreated
let pendingCaptureImage: string | null = null;
let mainWindow: BrowserWindow | null = null;
let captureWindows: BrowserWindow[] = [];
let tray: Tray | null = null;

// Base64 simple icon (a dot)
const TRAY_ICON_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAADFJREFUOE9jZGBg+M+AG3Boxg0D/x81gG4IqW6AATQ+I82G7tHwYBgw/GfADRgY0jAAAMwXEQWjZJ2VAAAAAElFTkSuQmCC';

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

function createTray() {
    const icon = nativeImage.createFromDataURL(TRAY_ICON_BASE64);
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
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 900,
        minHeight: 600,
        backgroundColor: '#F8F9FD',
        titleBarStyle: 'hiddenInset',
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
