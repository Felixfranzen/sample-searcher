import { AutoProcessor, ClapAudioModelWithProjection, read_audio } from '@xenova/transformers';


export class ClapModel {
  async generateEmbedding(filePath: string): Promise<number[]> {
    // Load processor and audio model
    const processor = await AutoProcessor.from_pretrained('Xenova/clap-htsat-unfused');
    const audio_model = await ClapAudioModelWithProjection.from_pretrained('Xenova/clap-htsat-unfused');

    // Read audio and run processor
    const audio = await read_audio('https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/cat_meow.wav', 48000);
    const audio_inputs = await processor(audio);

    // Compute embeddings
    const { audio_embeds } = await audio_model(audio_inputs);
    return audio_embeds
  }
} 