import { Result } from './types';

// Sample base64 placeholder image (a simple math formula placeholder)
const SAMPLE_IMAGE_DATA_URL = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMWUxZTJlIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI0MCUiIGZvbnQtZmFtaWx5PSJzZXJpZiIgZm9udC1zaXplPSIyNCIgZmlsbD0iI2NkZDZmNCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+4oirPC90ZXh0PgogIDx0ZXh0IHg9IjUwJSIgeT0iNjAlIiBmb250LWZhbWlseT0ic2VyaWYiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiNjZGQ2ZjQiIHRleHQtYW5jaG9yPSJtaWRkbGUiPnheMiBkeDwvdGV4dD4KICA8dGV4dCB4PSI1MCUiIHk9IjgwJSIgZm9udC1mYW1pbHk9InNlcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSIjODk5NGE3IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5DYXB0dXJlZCBGb3JtdWxhPC90ZXh0Pgo8L3N2Zz4=';

const SAMPLE_LATEX = String.raw`\int_0^1 x^2 \, dx = \frac{1}{3}`;

// Mock capture and recognize in one step (for browser dev)
export async function mockCaptureAndRecognize(): Promise<Result> {
    // Simulate capture and recognition delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    return {
        imageDataUrl: SAMPLE_IMAGE_DATA_URL,
        latex: SAMPLE_LATEX,
    };
}

// Mock recognize LaTeX from image (used after capture)
export async function mockRecognizeLatex(_imageDataUrl: string): Promise<string> {
    // Simulate recognition delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    return SAMPLE_LATEX;
}
