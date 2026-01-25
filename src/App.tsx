import { useState, useCallback, useEffect, useRef } from 'react';
import { AppState, Result, CapturedImage } from './types';
import { ocr } from './lib/ocr';
import TopBar from './components/TopBar';
import ImagePanel from './components/ImagePanel';
import LatexPanel from './components/LatexPanel';
import Toast from './components/Toast';
import ModelLoadingOverlay from './components/ModelLoadingOverlay';

const isElectron = !!window.electronAPI;

function App() {
    const [state, setState] = useState<AppState>('idle');
    const [capturedImage, setCapturedImage] = useState<CapturedImage | null>(null);
    const [result, setResult] = useState<Result | null>(null);
    const [latex, setLatex] = useState<string>('');
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [progress, setProgress] = useState<{ status: string; percent: number } | null>(null);
    const modelInitPromise = useRef<Promise<void> | null>(null);

    // Electron listeners are now set up in the effect below that depends on performOCR

    const initModel = useCallback(() => {
        if (!modelInitPromise.current) {
            console.log('Initializing OCR model...');
            modelInitPromise.current = ocr.init(
                {
                    modelName: 'tiennguyenbnbk/formulasnap',
                    env: {
                        remoteHost: 'https://huggingface.co/',
                        remotePathTemplate: '{model}/resolve/{revision}'
                    }
                },
                (data) => {
                    console.log('Model loading progress:', data);
                    if (data.status === 'initiate') {
                        setProgress({ status: 'Initiating...', percent: 0 });
                    } else if (data.status === 'download') {
                        // Estimate total progress if multiple files
                        setProgress({
                            status: `Downloading ${data.file}...`,
                            percent: data.progress || 0
                        });
                    } else if (data.status === 'done') {
                        setProgress(null);
                    }
                }
            ).catch(err => {
                console.error('Failed to init model:', err);
                setToastMessage('Lỗi khởi tạo mô hình: ' + err.message);
                setShowToast(true);
                modelInitPromise.current = null;
                throw err;
            });
        }
        return modelInitPromise.current ?? Promise.resolve();
    }, []);

    // Initialize model on mount
    useEffect(() => {
        void initModel();
    }, [initModel]);

    const performOCR = useCallback(async (file: File | string) => {
        setState('loading');
        try {
            await initModel();
        } catch {
            setState('error');
            return;
        }

        try {
            let fileObj: File;
            let dataUrl: string;

            if (typeof file === 'string') {
                dataUrl = file;
                const res = await fetch(file);
                const blob = await res.blob();
                fileObj = new File([blob], "capture.png", { type: "image/png" });
            } else {
                fileObj = file;
                dataUrl = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target?.result as string);
                    reader.readAsDataURL(fileObj);
                });
            }

            setCapturedImage({ imageDataUrl: dataUrl });
            // Clear previous result while loading
            setResult(null);
            setLatex('');

            const latexResult = await ocr.predict(fileObj);

            setResult({ imageDataUrl: dataUrl, latex: latexResult });
            setLatex(latexResult);
            setState('success');
        } catch (e) {
            console.error(e);
            setState('error');
            setToastMessage('Không thể nhận dạng công thức: ' + (e instanceof Error ? e.message : String(e)));
            setShowToast(true);
        }
    }, [initModel]);

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
            // Non-Electron (Browser) Mode
            setToastMessage('Chức năng chụp màn hình chỉ hoạt động trên ứng dụng máy tính (Electron).');
            setShowToast(true);
        }
    }, []);

    // Handle Electron capture result
    useEffect(() => {
        if (isElectron && window.electronAPI) {
            // Check if onCaptureResult is a property we can set (it depends on how preload exposes it)
            // If it is exposed as a function to register a listener, we should use that.
            // Based on previous code: window.electronAPI.onCaptureResult?.(...) it seems it was a function to register a callback?
            // Let's check preload.ts via view_file if this fails, but for now assuming it was a listener registration function.
            // The previous code was: window.electronAPI.onCaptureResult?.((imageDataUrl) => { ... })

            window.electronAPI.onCaptureResult?.((imageDataUrl: string) => {
                performOCR(imageDataUrl);
            });

            window.electronAPI.onCaptureCancelled?.(() => {
                setState('idle');
            });
        }
    }, [performOCR]);

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
        performOCR(file);
    }, [performOCR]);

    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            const items = e.clipboardData?.items;
            if (!items) return;

            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const file = items[i].getAsFile();
                    if (file) {
                        handleImageUpload(file);
                    }
                    break;
                }
            }
        };

        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [handleImageUpload]);

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
            <main className="flex-1 p-2 overflow-hidden relative">
                <ModelLoadingOverlay
                    isVisible={!!progress}
                    status={progress?.status || ''}
                    percent={progress?.percent}
                    fileName={progress?.status.includes('Downloading') ? progress.status.replace('Downloading ', '').replace('...', '') : undefined}
                />

                <div className="h-full grid grid-cols-1 lg:grid-cols-2 gap-2">
                    <ImagePanel
                        state={state}
                        imageDataUrl={capturedImage?.imageDataUrl || result?.imageDataUrl}
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
                    Phím tắt: <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600 font-mono text-xs">Ctrl+Shift+S hoặc ⌘+Shift+S</kbd>
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
