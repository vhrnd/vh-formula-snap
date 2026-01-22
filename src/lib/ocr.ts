import { OCRAction, WorkerStatus, type ModelConfig, type ProgressInfo } from '../workers/ocr.worker';

// Define the shape of the response from the worker
interface WorkerMessage {
    status: WorkerStatus;
    output?: string;
    error?: string;
    key?: string;
    // Progress fields
    name?: string;
    file?: string;
    progress?: number;
    loaded?: number;
    total?: number;
}

export class OCR {
    private worker: Worker;
    private listeners: Map<string, (data: any) => void> = new Map();
    private progressCallback?: (data: ProgressInfo) => void;
    private initPromise: Promise<void> | null = null;
    private isReady = false;

    constructor() {
        this.worker = new Worker(new URL('../workers/ocr.worker.ts', import.meta.url), {
            type: 'module',
        });

        this.worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
            const data = event.data;

            if (data.status === WorkerStatus.Progress) {
                this.progressCallback?.(data as ProgressInfo);
                return;
            }

            if (data.status === WorkerStatus.Ready) {
                // Initialize resolution handled in init() promise
                return;
            }

            if (data.key && this.listeners.has(data.key)) {
                this.listeners.get(data.key)!(data);
                this.listeners.delete(data.key);
            }
        };
    }

    public async init(
        modelConfig: ModelConfig,
        onProgress?: (data: ProgressInfo) => void
    ): Promise<void> {
        if (this.initPromise) {
            if (onProgress) {
                this.progressCallback = onProgress;
            }
            return this.initPromise;
        }

        this.progressCallback = onProgress;

        this.initPromise = new Promise((resolve, reject) => {
            // One-time listener for Ready status
            const handleReady = (event: MessageEvent<WorkerMessage>) => {
                if (event.data.status === WorkerStatus.Ready) {
                    this.worker.removeEventListener('message', handleReady);
                    this.isReady = true;
                    resolve();
                } else if (event.data.status === WorkerStatus.Error && !event.data.key) {
                    this.worker.removeEventListener('message', handleReady);
                    this.initPromise = null;
                    reject(new Error(event.data.error));
                }
            };
            this.worker.addEventListener('message', handleReady);

            this.worker.postMessage({
                action: OCRAction.Init,
                model_config: modelConfig,
            });
        });

        return this.initPromise;
    }

    public async predict(image: File): Promise<string> {
        if (!this.isReady) {
            if (this.initPromise) {
                await this.initPromise;
            } else {
                throw new Error('Model not initialized. Please call init first.');
            }
        }

        return new Promise((resolve, reject) => {
            const key = crypto.randomUUID();

            this.listeners.set(key, (data: WorkerMessage) => {
                if (data.status === WorkerStatus.Result && data.output) {
                    resolve(data.output);
                } else if (data.status === WorkerStatus.Error) {
                    reject(new Error(data.error));
                }
            });

            this.worker.postMessage({
                action: OCRAction.Predict,
                image,
                key,
            });
        });
    }
}

export const ocr = new OCR();
