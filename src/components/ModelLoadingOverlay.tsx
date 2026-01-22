import React from 'react';

interface ModelLoadingOverlayProps {
    status: string;
    percent?: number;
    fileName?: string;
    isVisible: boolean;
}

const ModelLoadingOverlay: React.FC<ModelLoadingOverlayProps> = ({ status, percent, fileName, isVisible }) => {
    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm transition-all duration-300">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-[400px] border border-gray-100">
                <div className="flex items-center space-x-3 mb-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                    <h3 className="text-lg font-semibold text-gray-800">Đang tải mô hình AI</h3>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                        <span>{status}</span>
                        {percent !== undefined && <span className="font-medium text-indigo-600">{percent.toFixed(0)}%</span>}
                    </div>

                    {percent !== undefined && (
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-indigo-600 rounded-full transition-all duration-300 ease-out"
                                style={{ width: `${Math.max(5, percent)}%` }}
                            />
                        </div>
                    )}

                    {fileName && (
                        <p className="text-xs text-gray-400 truncate mt-1">
                            File: {fileName}
                        </p>
                    )}

                    <p className="text-xs text-gray-500 italic mt-3 border-t pt-3 border-gray-50">
                        Lần đầu chạy sẽ mất khoảng 1-2 phút để tải mô hình (~100MB). Các lần sau sẽ chạy ngay lập tức.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ModelLoadingOverlay;
