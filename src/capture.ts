// Capture overlay script - TRUE transparent overlay
// User selects region on LIVE desktop, then we capture

interface SelectionRect {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
}

let isSelecting = false;
let selection: SelectionRect | null = null;

const overlay = document.getElementById('capture-overlay')!;
const selectionBox = document.getElementById('selection-box')!;
const sizeIndicator = document.getElementById('size-indicator')!;

// Mouse event handlers
document.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;

    isSelecting = true;
    selection = {
        startX: e.clientX,
        startY: e.clientY,
        endX: e.clientX,
        endY: e.clientY,
    };

    // Show semi-transparent overlay when user starts selecting
    overlay.classList.add('selecting');
    selectionBox.style.display = 'block';
    updateSelectionBox();
});

document.addEventListener('mousemove', (e) => {
    if (!isSelecting || !selection) return;

    selection.endX = e.clientX;
    selection.endY = e.clientY;
    updateSelectionBox();
});

document.addEventListener('mouseup', async (e) => {
    if (!isSelecting || !selection) return;

    isSelecting = false;
    selection.endX = e.clientX;
    selection.endY = e.clientY;

    const rect = getNormalizedRect(selection);

    // Minimum selection size
    if (rect.width < 10 || rect.height < 10) {
        resetSelection();
        return;
    }

    // IMPORTANT: Hide overlay first, then capture
    await captureAndCrop(rect);
});

// Keyboard handler
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        window.electronAPI?.captureCancel();
    }
});

function updateSelectionBox() {
    if (!selection) return;

    const rect = getNormalizedRect(selection);

    selectionBox.style.left = `${rect.x}px`;
    selectionBox.style.top = `${rect.y}px`;
    selectionBox.style.width = `${rect.width}px`;
    selectionBox.style.height = `${rect.height}px`;

    sizeIndicator.textContent = `${rect.width} × ${rect.height}`;
}

function getNormalizedRect(sel: SelectionRect) {
    const x = Math.min(sel.startX, sel.endX);
    const y = Math.min(sel.startY, sel.endY);
    const width = Math.abs(sel.endX - sel.startX);
    const height = Math.abs(sel.endY - sel.startY);
    return { x, y, width, height };
}

function resetSelection() {
    isSelecting = false;
    selection = null;
    selectionBox.style.display = 'none';
    overlay.classList.remove('selecting');
}

async function captureAndCrop(rect: { x: number; y: number; width: number; height: number }) {
    try {
        // Step 1: Hide overlay
        await window.electronAPI?.hideOverlayForCapture();

        // Step 2: Capture screen NOW (without overlay)
        // Parse displayId from URL params
        const urlParams = new URLSearchParams(window.location.search);
        const displayId = urlParams.get('displayId') ? parseInt(urlParams.get('displayId')!) : undefined;

        const result = await window.electronAPI?.captureScreenNow(displayId);

        if (!result?.success || !result.imageDataUrl) {
            window.electronAPI?.captureCancel();
            return;
        }

        // Step 3: Crop the captured image to the selected region
        const croppedDataUrl = await cropImage(result.imageDataUrl, rect, result.displaySize!);

        // Step 4: Send to main window
        window.electronAPI?.captureComplete(croppedDataUrl);

    } catch (error) {
        console.error('Capture failed:', error);
        window.electronAPI?.captureCancel();
    }
}

async function cropImage(
    fullImageDataUrl: string,
    rect: { x: number; y: number; width: number; height: number },
    _displaySize: { width: number; height: number }
): Promise<string> {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            // Calculate scale between image and window
            const scaleX = img.width / window.innerWidth;
            const scaleY = img.height / window.innerHeight;

            // Create canvas for cropped region
            const canvas = document.createElement('canvas');
            canvas.width = rect.width * scaleX;
            canvas.height = rect.height * scaleY;
            const ctx = canvas.getContext('2d')!;

            // Draw cropped region
            ctx.drawImage(
                img,
                rect.x * scaleX,
                rect.y * scaleY,
                rect.width * scaleX,
                rect.height * scaleY,
                0,
                0,
                canvas.width,
                canvas.height
            );

            resolve(canvas.toDataURL('image/png'));
        };
        img.src = fullImageDataUrl;
    });
}
