import { useEffect } from 'react';
import { CheckCircle2, X } from 'lucide-react';

interface ToastProps {
    message: string;
    isVisible: boolean;
    onClose: () => void;
    duration?: number;
}

function Toast({ message, isVisible, onClose, duration = 2000 }: ToastProps) {
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [isVisible, duration, onClose]);

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
            <div className="flex items-center gap-3 px-5 py-3 bg-white border border-gray-200 rounded-xl shadow-xl">
                <div className="p-1.5 bg-green-100 rounded-full">
                    <CheckCircle2 className="w-4 h-4 text-[#8AC449]" />
                </div>
                <span className="text-sm font-semibold text-gray-700">{message}</span>
                <button
                    onClick={onClose}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors ml-2"
                >
                    <X className="w-4 h-4 text-gray-400" />
                </button>
            </div>
        </div>
    );
}

export default Toast;
