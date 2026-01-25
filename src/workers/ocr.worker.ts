import {
    PreTrainedTokenizer,
    Tensor,
    VisionEncoderDecoderModel,
    cat,
    env,
} from '@huggingface/transformers';
import { preprocessImg } from './imageProcessor';
import { normalizeLatex } from '../utils/latex';


// Configure environment
env.allowLocalModels = false;
// Wasm settings might need adjustment depending on the environment/vite setup but starting with this as per Texo-web
if (env.backends?.onnx?.wasm) {
    env.backends.onnx.wasm.proxy = true;
}

// Define types locally since we aren't porting the entire types file yet
export interface ModelConfig {
    modelName: string;
    env?: {
        remoteHost?: string;
        remotePathTemplate?: string;
    };
}

export interface ProgressInfo {
    status: string;
    name?: string;
    file?: string;
    progress?: number;
    loaded?: number;
    total?: number;
}

// Worker message types
export enum OCRAction {
    Init = 'Init',
    Predict = 'Predict',
}

export enum WorkerStatus {
    Ready = 'Ready',
    Progress = 'Progress',
    Result = 'Result',
    Error = 'Error',
}

let model: VisionEncoderDecoderModel;
let tokenizer: PreTrainedTokenizer;
let isInitialized = false;

const init = async (
    model_config: ModelConfig,
    progress_callback: (data: ProgressInfo) => void
) => {
    if (isInitialized) {
        return;
    }

    // Apply environment configuration if provided
    if (model_config.env) {
        if (model_config.env.remoteHost) env.remoteHost = model_config.env.remoteHost;
        if (model_config.env.remotePathTemplate) env.remotePathTemplate = model_config.env.remotePathTemplate;
    }

    const modelName = model_config.modelName;

    model = await VisionEncoderDecoderModel.from_pretrained(modelName, {
        dtype: 'fp32',
        progress_callback: progress_callback,
    });

    tokenizer = await PreTrainedTokenizer.from_pretrained(modelName);

    isInitialized = true;

    // Notify main thread
    self.postMessage({
        status: WorkerStatus.Ready,
    });
};

const predict = async (imageFile: File) => {
    if (!isInitialized) {
        throw new Error('Model not initialized. Please call init first.');
    }

    const { array } = await preprocessImg(imageFile);
    const tensor = new Tensor('float32', array, [1, 1, 384, 384]);
    // The model expects pixel_values to be [batch, channels, height, width] with 3 channels?
    // Texo-web's code: const pixel_values = cat([tensor, tensor, tensor], 1)
    // This concatenates along dimension 1 (channels), creating a 3-channel image from the grayscale one.
    const pixel_values = cat([tensor, tensor, tensor], 1);

    const outputs = await model.generate({ inputs: pixel_values });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const text = tokenizer.batch_decode(outputs as any, { skip_special_tokens: true })[0];

    // Post-processing: remove negative space characters (\!) and normalize spaces
    // Use our smart normalization utility
    return normalizeLatex(text);
};

self.onmessage = async (event: MessageEvent) => {
    const { action, model_config, image, key } = event.data;

    if (action === OCRAction.Init) {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await init(model_config, (data: any) => {
                self.postMessage({
                    status: WorkerStatus.Progress,
                    ...data
                })
            });
        } catch (error) {
            console.error(error);
            self.postMessage({
                status: WorkerStatus.Error,
                error: error instanceof Error ? error.message : String(error),
                key: '',
            });
        }
    }

    if (action === OCRAction.Predict) {
        try {
            const output = await predict(image);
            self.postMessage({
                status: WorkerStatus.Result,
                output,
                key,
            });
        } catch (error) {
            console.error(error);
            self.postMessage({
                status: WorkerStatus.Error,
                error: error instanceof Error ? error.message : String(error),
                key,
            });
        }
    }
};
