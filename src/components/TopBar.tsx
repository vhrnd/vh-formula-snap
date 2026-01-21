import { Camera, Copy, Trash2, Loader2 } from 'lucide-react';
import { AppState } from '../types';

// VuiHoc Logo URL
const VUIHOC_LOGO = 'https://xcdn-cf.vuihoc.vn/upload/5c209fe6176b0/2022/02/18/7d72_logo-vuihoc-bitu-normal.png';

interface TopBarProps {
    state: AppState;
    onCapture: () => void;
    onCopyLatex: () => void;
    onClear: () => void;
    hasLatex: boolean;
}

function TopBar({ state, onCapture, onCopyLatex, onClear, hasLatex }: TopBarProps) {
    const isLoading = state === 'loading';
    const isCapturing = state === 'capturing';
    const isDisabled = isLoading || isCapturing;

    const getStatusConfig = () => {
        switch (state) {
            case 'idle':
                return { label: 'Sẵn sàng', className: 'status-idle' };
            case 'capturing':
                return { label: 'Đang chụp…', className: 'status-loading' };
            case 'captured':
                return { label: 'Đã chụp', className: 'status-success' };
            case 'loading':
                return { label: 'Đang nhận dạng…', className: 'status-loading' };
            case 'success':
                return { label: 'Hoàn thành', className: 'status-success' };
            case 'error':
                return { label: 'Lỗi', className: 'status-error' };
            default:
                return { label: 'Sẵn sàng', className: 'status-idle' };
        }
    };

    const statusConfig = getStatusConfig();

    return (
        <header className="px-4 py-3 bg-gradient-to-r from-[#FF6609] to-[#E85A08] shadow-md app-drag pl-20">
            <div className="flex items-center justify-between">
                {/* Logo & Title */}
                <div className="flex items-center gap-3 app-no-drag">
                    <div className="p-0.5">
                        <img
                            src={VUIHOC_LOGO}
                            alt="VuiHoc"
                            className="h-10 w-auto"
                        />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-white">
                            FormulaSnap
                        </h1>
                        <p className="text-xs text-white/80">Chụp và nhận dạng công thức</p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 app-no-drag">
                    {/* Capture Button - Green Primary */}
                    <button
                        onClick={onCapture}
                        disabled={isDisabled}
                        className="btn bg-[#8AC449] text-white hover:bg-[#7AB839] flex items-center gap-2 shadow-sm"
                    >
                        {isCapturing ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Đang chụp…</span>
                            </>
                        ) : isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Nhận dạng…</span>
                            </>
                        ) : (
                            <>
                                <Camera className="w-4 h-4" />
                                <span>Chụp</span>
                            </>
                        )}
                    </button>

                    {/* Copy LaTeX Button */}
                    <button
                        onClick={onCopyLatex}
                        disabled={isDisabled || !hasLatex}
                        className="btn bg-white/20 text-white hover:bg-white/30 border border-white/30 flex items-center gap-2"
                    >
                        <Copy className="w-4 h-4" />
                        <span>Sao chép</span>
                    </button>

                    {/* Clear Button */}
                    <button
                        onClick={onClear}
                        disabled={isDisabled || state === 'idle'}
                        className="btn bg-transparent text-white/80 hover:bg-white/10 flex items-center gap-2"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>

                    {/* Status Badge */}
                    <div className={`status-badge ${statusConfig.className} flex items-center gap-1.5 ml-1`}>
                        {(isLoading || isCapturing) && <Loader2 className="w-3 h-3 animate-spin" />}
                        <span>{statusConfig.label}</span>
                    </div>
                </div>
            </div>
        </header>
    );
}

export default TopBar;
