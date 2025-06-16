import * as ort from 'onnxruntime-node';

export class ClapModel {
  private session: ort.InferenceSession | null = null;
  private modelPath: string;

  constructor(modelPath: string) {
    this.modelPath = modelPath;
  }

  async initialize() {
    if (!this.session) {
      this.session = await ort.InferenceSession.create(this.modelPath);
    }
  }

  async generateEmbedding(audioData: Float32Array): Promise<number[]> {
    if (!this.session) {
      throw new Error('Model not initialized. Call initialize() first.');
    }

    // Prepare input tensor
    const inputTensor = new ort.Tensor('float32', audioData, [1, audioData.length]);

    // Run inference
    const results = await this.session.run({ input: inputTensor });
    const embedding = results.output.data as Float32Array;

    // Convert to regular array and normalize
    const embeddingArray = Array.from(embedding);
    const magnitude = Math.sqrt(embeddingArray.reduce((sum, val) => sum + val * val, 0));
    return embeddingArray.map(val => val / magnitude);
  }
} 