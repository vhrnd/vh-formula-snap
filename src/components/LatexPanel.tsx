import { useState, useEffect } from 'react';
import { Code2, Eye, AlertTriangle, Loader2 } from 'lucide-react';
import { BlockMath } from 'react-katex';
import { AppState } from '../types';

interface LatexPanelProps {
    state: AppState;
    latex: string;
    onLatexChange: (latex: string) => void;
}

function LatexPanel({ state, latex, onLatexChange }: LatexPanelProps) {
    const isLoading = state === 'loading';
    const [latexError, setLatexError] = useState<string | null>(null);

    useEffect(() => {
        if (!latex) {
            setLatexError(null);
            return;
        }
        setLatexError(null);
    }, [latex]);

    return (
        <div className="flex flex-col gap-2 h-full">
            {/* LaTeX Editor */}
            <div className="card flex flex-col flex-1">
                <div className="px-3 py-2 border-b border-gray-100">
                    <h2 className="text-xs font-bold text-gray-600 uppercase tracking-wide flex items-center gap-2">
                        <Code2 className="w-3.5 h-3.5 text-[#8AC449]" />
                        Mã LaTeX
                    </h2>
                </div>
                <div className="flex-1 p-2">
                    {isLoading ? (
                        <div className="h-full flex items-center justify-center text-gray-500">
                            <div className="flex flex-col items-center gap-2">
                                <Loader2 className="w-5 h-5 animate-spin text-[#8AC449]" />
                                <span className="text-xs font-medium">Đang nhận dạng…</span>
                            </div>
                        </div>
                    ) : (
                        <textarea
                            value={latex}
                            onChange={(e) => onLatexChange(e.target.value)}
                            placeholder="Mã LaTeX sẽ xuất hiện ở đây…"
                            className="w-full h-full min-h-[80px] p-3 bg-gray-50 border border-gray-200 rounded-lg 
                         text-gray-800 font-mono text-sm resize-none
                         focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-[#8AC449]
                         placeholder:text-gray-400"
                        />
                    )}
                </div>
            </div>

            {/* LaTeX Preview */}
            <div className="card flex flex-col flex-1">
                <div className="px-3 py-2 border-b border-gray-100">
                    <h2 className="text-xs font-bold text-gray-600 uppercase tracking-wide flex items-center gap-2">
                        <Eye className="w-3.5 h-3.5 text-[#FF6609]" />
                        Xem trước
                    </h2>
                </div>
                <div className="flex-1 p-4 bg-gray-50/30 grid place-items-center overflow-hidden">
                    {isLoading ? (
                        <div className="text-gray-500 flex flex-col items-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin text-[#FF6609]" />
                            <span className="text-xs font-medium">Đang tạo xem trước…</span>
                        </div>
                    ) : latex ? (
                        <div className="max-w-full max-h-full overflow-auto scrollbar-hidden">
                            <LatexPreview latex={latex} onError={(err) => setLatexError(err)} />
                        </div>
                    ) : (
                        <div className="text-gray-400 flex flex-col items-center justify-center">
                            <Eye className="w-8 h-8 mx-auto mb-1.5 opacity-50" />
                            <p className="text-xs">Công thức sẽ hiển thị ở đây</p>
                        </div>
                    )}
                </div>

                {latexError && (
                    <div className="px-4 py-2 bg-red-50 border-t border-red-200 flex items-center gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                        <p className="text-xs text-red-600 font-medium">{latexError}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

interface LatexPreviewProps {
    latex: string;
    onError: (error: string | null) => void;
}

function LatexPreview({ latex, onError }: LatexPreviewProps) {
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        setHasError(false);
        onError(null);
    }, [latex, onError]);

    if (hasError) {
        return (
            <div className="flex items-center gap-2 text-red-500">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">LaTeX không hợp lệ</span>
            </div>
        );
    }

    try {
        return (
            <div className="text-gray-800">
                <BlockMath
                    math={latex}
                    errorColor="#E53E3E"
                    renderError={({ error }) => {
                        setTimeout(() => {
                            setHasError(true);
                            onError('LaTeX lỗi: ' + error.message);
                        }, 0);
                        return (
                            <div className="flex items-center gap-2 text-red-500">
                                <AlertTriangle className="w-4 h-4" />
                                <span className="text-sm font-medium">LaTeX không hợp lệ</span>
                            </div>
                        );
                    }}
                />
            </div>
        );
    } catch {
        return (
            <div className="flex items-center gap-2 text-red-500">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">LaTeX không hợp lệ</span>
            </div>
        );
    }
}

export default LatexPanel;
