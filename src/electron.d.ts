// Type declarations for Electron API exposed via preload script

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

interface ElectronAPI {
    copyToClipboard: (text: string) => Promise<boolean>;
    startCapture: () => Promise<CaptureResult>;
    hideOverlayForCapture: () => Promise<{ success: boolean }>;
    captureScreenNow: (displayId?: number) => Promise<ScreenCaptureResult>;
    getCapturedScreen: () => Promise<string | null>;
    getScreenSources: () => Promise<ScreenSource[]>;
    captureComplete: (imageDataUrl: string) => Promise<CaptureResult>;
    captureCancel: () => Promise<CaptureResult>;
    getDisplaySize: () => Promise<DisplaySize>;
    onCaptureResult: (callback: (imageDataUrl: string) => void) => void;
    onCaptureCancelled: (callback: () => void) => void;
    platform: string;
}

declare global {
    interface Window {
        electronAPI?: ElectronAPI;
        handleCaptureComplete?: (imageDataUrl: string) => void;
    }
}

export { };
