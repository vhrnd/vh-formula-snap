import { useState, useCallback, useEffect } from 'react';
import { AppState, Result, CapturedImage } from './types';
import { mockRecognizeLatex, mockCaptureAndRecognize } from './mock';
import TopBar from './components/TopBar';
import ImagePanel from './components/ImagePanel';
import LatexPanel from './components/LatexPanel';
import Toast from './components/Toast';

const isElectron = !!window.electronAPI;

function App() {
    const [state, setState] = useState<AppState>('idle');
    const [capturedImage, setCapturedImage] = useState<CapturedImage | null>(null);
    const [result, setResult] = useState<Result | null>(null);
    const [latex, setLatex] = useState<string>('');
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    useEffect(() => {
        if (isElectron && window.electronAPI) {
            window.electronAPI.onCaptureResult?.((imageDataUrl: string) => {
                setCapturedImage({ imageDataUrl });
                setState('captured');
            });

            window.electronAPI.onCaptureCancelled?.(() => {
                setState('idle');
            });
        }
    }, []);

    const handleCapture = useCallback(async () => {
        if (isElectron && window.electronAPI) {
            setState('capturing');
            const result = await window.electronAPI.startCapture();
            if (!result.success) {
                setState('error');
                setToastMessage('Không thể bắt đầu chụp');
                setShowToast(true);
            }
        } else {
            setState('loading');
            try {
                const data = await mockCaptureAndRecognize();
                setCapturedImage({ imageDataUrl: data.imageDataUrl });
                setResult(data);
                setLatex(data.latex);
                setState('success');
            } catch {
                setState('error');
            }
        }
    }, []);

    const handleSubmit = useCallback(async () => {
        if (!capturedImage) return;

        setState('loading');
        try {
            const latexResult = await mockRecognizeLatex(capturedImage.imageDataUrl);
            setResult({ imageDataUrl: capturedImage.imageDataUrl, latex: latexResult });
            setLatex(latexResult);
            setState('success');
        } catch {
            setState('error');
            setToastMessage('Không thể nhận dạng công thức');
            setShowToast(true);
        }
    }, [capturedImage]);

    const handleCopyLatex = useCallback(async () => {
        if (!latex) return;
        try {
            if (isElectron && window.electronAPI) {
                await window.electronAPI.copyToClipboard(latex);
            } else {
                await navigator.clipboard.writeText(latex);
            }
            setToastMessage('Đã sao chép!');
            setShowToast(true);
        } catch {
            setToastMessage('Không thể sao chép');
            setShowToast(true);
        }
    }, [latex]);

    const handleClear = useCallback(() => {
        setState('idle');
        setCapturedImage(null);
        setResult(null);
        setLatex('');
    }, []);

    const handleLatexChange = useCallback((newLatex: string) => {
        setLatex(newLatex);
    }, []);

    const handleImageUpload = useCallback((file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            if (dataUrl) {
                setCapturedImage({ imageDataUrl: dataUrl });
                setState('captured');
                setResult(null);
                setLatex('');
            }
        };
        reader.readAsDataURL(file);
    }, []);

    return (
        <div className="h-screen bg-[#F8F9FD] flex flex-col overflow-hidden">
            {/* Top Bar */}
            <TopBar
                state={state}
                onCapture={handleCapture}
                onCopyLatex={handleCopyLatex}
                onClear={handleClear}
                hasLatex={!!latex}
            />

            {/* Main Content - Compact */}
            <main className="flex-1 p-4 overflow-hidden">
                <div className="h-full grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <ImagePanel
                        state={state}
                        imageDataUrl={capturedImage?.imageDataUrl || result?.imageDataUrl}
                        onSubmit={handleSubmit}
                        onImageUpload={handleImageUpload}
                    />
                    <LatexPanel
                        state={state}
                        latex={latex}
                        onLatexChange={handleLatexChange}
                    />
                </div>
            </main>

            {/* Compact Footer */}
            <footer className="px-4 py-2 border-t border-gray-200 bg-white">
                <p className="text-xs text-gray-500 text-center">
                    Phím tắt: <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600 font-mono text-xs">⌘+Shift+S</kbd>
                </p>
            </footer>

            <Toast
                message={toastMessage}
                isVisible={showToast}
                onClose={() => setShowToast(false)}
            />
        </div>
    );
}

export default App;
