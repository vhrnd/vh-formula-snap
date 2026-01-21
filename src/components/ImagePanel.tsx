import React, { useRef } from 'react';
import { ImageIcon, Loader2, Send } from 'lucide-react';
import { AppState } from '../types';

interface ImagePanelProps {
    state: AppState;
    imageDataUrl?: string;
    onSubmit?: () => void;
    onImageUpload?: (file: File) => void;
}

function ImagePanel({ state, imageDataUrl, onSubmit, onImageUpload }: ImagePanelProps) {
    const isLoading = state === 'loading';
    const isCapturing = state === 'capturing';
    const isCaptured = state === 'captured';
    const hasImage = !!imageDataUrl;

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && onImageUpload) {
            onImageUpload(file);
        }
        // Reset input to allow selecting same file again
        if (e.target) e.target.value = '';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/') && onImageUpload) {
            onImageUpload(file);
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const file = items[i].getAsFile();
                if (file && onImageUpload) {
                    onImageUpload(file);
                }
                break;
            }
        }
    };

    const handleAreaClick = () => {
        if (!hasImage && !isCapturing && !isLoading) {
            fileInputRef.current?.click();
        }
    };

    return (
        <div
            className="card flex flex-col h-full focus:outline-none focus:ring-2 focus:ring-green-100 transition-shadow"
            tabIndex={0}
            onPaste={handlePaste}
        >
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-xs font-bold text-gray-600 uppercase tracking-wide flex items-center gap-2">
                    <ImageIcon className="w-3.5 h-3.5 text-[#8AC449]" />
                    Hình ảnh
                </h2>

                {isCaptured && hasImage && onSubmit && (
                    <button
                        onClick={onSubmit}
                        className="btn btn-accent flex items-center gap-1.5 text-xs py-1.5 px-3"
                    >
                        <Send className="w-3.5 h-3.5" />
                        <span>Nhận dạng</span>
                    </button>
                )}
            </div>

            {/* Content */}
            <div
                className={`flex-1 p-4 flex items-center justify-center bg-gray-50/50 relative overflow-hidden
                           ${!hasImage ? 'cursor-pointer hover:bg-gray-100/50 transition-colors' : ''}`}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={handleAreaClick}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                />

                {isCapturing ? (
                    <div className="flex flex-col items-center gap-3 text-gray-500">
                        <div className="p-3 bg-orange-50 rounded-full">
                            <Loader2 className="w-6 h-6 animate-spin text-[#FF6609]" />
                        </div>
                        <p className="text-sm font-medium">Đang chờ chọn vùng…</p>
                    </div>
                ) : isLoading ? (
                    <div className="flex flex-col items-center gap-3 text-gray-500">
                        <div className="p-3 bg-green-50 rounded-full">
                            <Loader2 className="w-6 h-6 animate-spin text-[#8AC449]" />
                        </div>
                        <p className="text-sm font-medium">Đang nhận dạng…</p>
                    </div>
                ) : hasImage ? (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-3 relative z-10" onClick={(e) => e.stopPropagation()}>
                        <div className="relative group">
                            <img
                                src={imageDataUrl}
                                alt="Công thức đã chụp"
                                className="max-w-full max-h-[200px] object-contain rounded-lg border border-gray-200 shadow-sm"
                            />
                            {/* Overlay to re-upload on hover? Optional. For now keep simple */}
                        </div>

                        {isCaptured && (
                            <p className="text-xs text-gray-500">
                                Bấm <span className="text-[#FF6609] font-semibold">Nhận dạng</span> để chuyển sang LaTeX
                            </p>
                        )}
                        <button
                            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                            className="mt-2 text-xs text-gray-400 hover:text-[#8AC449] underline decoration-dotted"
                        >
                            Chọn ảnh khác
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-3 text-gray-400 select-none">
                        <div className="p-6 bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 group-hover:border-[#8AC449] transition-colors">
                            <ImageIcon className="w-10 h-10 group-hover:text-[#8AC449] transition-colors" />
                        </div>
                        <div className="text-center space-y-1">
                            <p className="text-gray-600 font-medium text-sm">Chưa có hình ảnh</p>
                            <p className="text-xs text-gray-400">
                                Dán (Ctrl+V), Kéo thả hoặc bấm để chọn
                            </p>
                            <div className="pt-2">
                                <button
                                    className="text-xs px-3 py-1 bg-white border border-gray-200 rounded-md shadow-sm hover:text-[#8AC449]"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (onSubmit) { // Using this as 'Capture' trigger is confusing if onSubmit is recognition.
                                            // The user should press TopBar Capture button for screenshot.
                                            // Here we just guide.
                                        }
                                    }}
                                >
                                    Hoặc bấm <b>Chụp</b> ở trên
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Drag Overlay hint (handled by CSS hover/active usually, or JS state) */}
            </div>
        </div>
    );
}

export default ImagePanel;
