import { contextBridge, ipcRenderer } from 'electron';

// Types
interface CaptureResult {
    success: boolean;
    error?: string;
    imageDataUrl?: string;
}

interface ScreenCaptureResult {
    success: boolean;
    imageDataUrl?: string;
    displaySize?: { width: number; height: number };
    error?: string;
}

interface ScreenSource {
    id: string;
    name: string;
    thumbnail: string;
}

interface DisplaySize {
    width: number;
    height: number;
}

// Expose API to renderer
contextBridge.exposeInMainWorld('electronAPI', {
    // Clipboard
    copyToClipboard: (text: string): Promise<boolean> =>
        ipcRenderer.invoke('copy-to-clipboard', text),

    // Capture
    startCapture: (): Promise<CaptureResult> =>
        ipcRenderer.invoke('start-capture'),

    hideOverlayForCapture: (): Promise<{ success: boolean }> =>
        ipcRenderer.invoke('hide-overlay-for-capture'),

    captureScreenNow: (displayId?: number): Promise<ScreenCaptureResult> =>
        ipcRenderer.invoke('capture-screen-now', displayId),

    getCapturedScreen: (): Promise<string | null> =>
        ipcRenderer.invoke('get-captured-screen'),

    getScreenSources: (): Promise<ScreenSource[]> =>
        ipcRenderer.invoke('get-screen-sources'),

    captureComplete: (imageDataUrl: string): Promise<CaptureResult> =>
        ipcRenderer.invoke('capture-complete', imageDataUrl),

    captureCancel: (): Promise<CaptureResult> =>
        ipcRenderer.invoke('capture-cancel'),

    getDisplaySize: (): Promise<DisplaySize> =>
        ipcRenderer.invoke('get-display-size'),

    // Event listeners
    onCaptureResult: (callback: (imageDataUrl: string) => void) => {
        ipcRenderer.on('capture-result', (_event, imageDataUrl) => callback(imageDataUrl));
    },

    onCaptureCancelled: (callback: () => void) => {
        ipcRenderer.on('capture-cancelled', () => callback());
    },

    platform: process.platform,
});
