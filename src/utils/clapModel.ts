import ffmpeg from 'fluent-ffmpeg';
import  { AutoProcessor, ClapAudioModelWithProjection, AutoTokenizer, ClapTextModelWithProjection } from '@xenova/transformers'


export class ClapModel {
  async generateEmbedding(filePath: string): Promise<number[]> {
    // Load processor and audio model
    const processor = await AutoProcessor.from_pretrained('Xenova/clap-htsat-unfused');
    const audio_model = await ClapAudioModelWithProjection.from_pretrained('Xenova/clap-htsat-unfused');

    // Convert audio to the right format using ffmpeg
    const audioBuffer = await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      ffmpeg(filePath)
        .toFormat('wav')
        .audioFrequency(48000)
        .audioChannels(1)
        .audioCodec('pcm_s16le')  // Use 16-bit PCM encoding
        .on('error', reject)
        .on('end', () => resolve(Buffer.concat(chunks)))
        .pipe()
        .on('data', (chunk: Buffer) => chunks.push(chunk));
    });

    // Convert 16-bit PCM to Float32Array
    const pcmData = new Int16Array(audioBuffer.buffer, audioBuffer.byteOffset, audioBuffer.byteLength / 2);
    const audioData = new Float32Array(pcmData.length);
    for (let i = 0; i < pcmData.length; i++) {
      audioData[i] = pcmData[i] / 32768.0;  // Normalize to [-1, 1]
    }

    const audio_inputs = await processor(audioData);

    // Compute embeddings
    const { audio_embeds } = await audio_model(audio_inputs);
    
    // Convert to regular array if needed
    const embedding = Array.from(audio_embeds.data) as number[];
    return embedding;
  }

  async generateTextEmbedding(text: string): Promise<number[]> {
    // Load tokenizer and text model
    const tokenizer = await AutoTokenizer.from_pretrained('Xenova/clap-htsat-unfused');
    const text_model = await ClapTextModelWithProjection.from_pretrained('Xenova/clap-htsat-unfused');

    // Process text
    const text_inputs = await tokenizer(text, { padding: true, truncation: true });

    // Compute embeddings
    const { text_embeds } = await text_model(text_inputs);
    
    // Convert to regular array
    const embedding = Array.from(text_embeds.data) as number[];
    return embedding;
  }
} 