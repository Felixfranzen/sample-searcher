import * as ort from 'onnxruntime-node';

export class ClapModel {
  private session: ort.InferenceSession | null = null;
  private modelPath: string;
  private readonly SAMPLE_RATE = 48000;

  constructor(modelPath: string) {
    this.modelPath = modelPath;
  }

  async initialize() {
    if (!this.session) {
      this.session = await ort.InferenceSession.create(this.modelPath);
    }
  }

  private preprocessAudio(audioData: Float32Array): Float32Array {
    // Normalize audio - using a more efficient method to find max
    let maxAbs = 0;
    for (let i = 0; i < audioData.length; i++) {
      const abs = Math.abs(audioData[i]);
      if (abs > maxAbs) maxAbs = abs;
    }
    
    // Normalize in place
    const normalizedAudio = new Float32Array(audioData.length);
    for (let i = 0; i < audioData.length; i++) {
      normalizedAudio[i] = audioData[i] / maxAbs;
    }

    // Ensure audio is the right length (CLAP expects 48000 samples)
    let processedAudio = normalizedAudio;
    if (normalizedAudio.length > this.SAMPLE_RATE) {
      // Take the middle portion if too long
      const start = Math.floor((normalizedAudio.length - this.SAMPLE_RATE) / 2);
      processedAudio = normalizedAudio.slice(start, start + this.SAMPLE_RATE);
    } else if (normalizedAudio.length < this.SAMPLE_RATE) {
      // Pad with zeros if too short
      const padded = new Float32Array(this.SAMPLE_RATE);
      padded.set(normalizedAudio);
      processedAudio = padded;
    }

    return processedAudio;
  }

  async generateEmbedding(audioData: Float32Array): Promise<number[]> {
    if (!this.session) {
      throw new Error('Model not initialized. Call initialize() first.');
    }

    // Preprocess audio
    const processedAudio = this.preprocessAudio(audioData);

    // Prepare input tensors
    // CLAP expects a 4D tensor: [batch_size, channels, time_steps, features]
    // For our case:
    // - batch_size = 1 (one audio file)
    // - channels = 1 (mono audio)
    // - time_steps = 1 (we're treating the entire audio as one time step)
    // - features = 48000 (the actual audio samples)
    const audioTensor = new ort.Tensor('float32', processedAudio, [1, 1, 1, this.SAMPLE_RATE]);
    
    // Create a dummy input_ids tensor (CLAP models typically expect this)
    const inputIds = new ort.Tensor('int64', new BigInt64Array([0n]), [1, 1]);

    // Create attention mask (all 1s since we want to attend to all tokens)
    const attentionMask = new ort.Tensor('int64', new BigInt64Array([1n]), [1, 1]);

    const feeds = {
      input_features: audioTensor,
      input_ids: inputIds,
      attention_mask: attentionMask
    }

    // Run inference with both inputs
    const results = await this.session.run(feeds);

    const embedding = results.output.data as Float32Array;

    // Convert to regular array and normalize
    const embeddingArray = Array.from(embedding);
    const magnitude = Math.sqrt(embeddingArray.reduce((sum, val) => sum + val * val, 0));
    return embeddingArray.map(val => val / magnitude);
  }
} 