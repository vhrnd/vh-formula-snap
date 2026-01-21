// idle: chưa có ảnh, chưa có latex
// capturing: đang trong quá trình chọn vùng chụp
// captured: đã chụp xong, đang hiển thị preview với nút Submit
// loading: đang nhận dạng LaTeX
// success: nhận dạng thành công
// error: có lỗi xảy ra
export type AppState = 'idle' | 'capturing' | 'captured' | 'loading' | 'success' | 'error';

export interface Result {
    imageDataUrl: string;
    latex: string;
}

export interface CapturedImage {
    imageDataUrl: string;
}
