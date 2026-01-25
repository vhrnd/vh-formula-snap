export type AppState = 'idle' | 'capturing' | 'captured' | 'loading' | 'success' | 'error';

export interface Result {
    imageDataUrl: string;
    latex: string;
}

export interface CapturedImage {
    imageDataUrl: string;
}
