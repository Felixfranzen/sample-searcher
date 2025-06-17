import ffmpeg from 'fluent-ffmpeg';
import { AutoProcessor, ClapAudioModelWithProjection, AutoTokenizer, ClapTextModelWithProjection } from '@xenova/transformers'

export const createClapModel = async () => {
    const processor = await AutoProcessor.from_pretrained('Xenova/clap-htsat-unfused');
    const audioModel = await ClapAudioModelWithProjection.from_pretrained('Xenova/clap-htsat-unfused');
    const tokenizer = await AutoTokenizer.from_pretrained('Xenova/clap-htsat-unfused');
    const textModel = await ClapTextModelWithProjection.from_pretrained('Xenova/clap-htsat-unfused');
    
    const modelInstance = {
      processor,
      audioModel,
      tokenizer,
      textModel
    };

  const readAndFormatAudioFile = async (filePath: string): Promise<Buffer> => {
    return new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      // TODO load ffmpeg on system correctly
      ffmpeg(filePath)
        .toFormat('wav')
        .audioFrequency(48000)
        .audioChannels(1)
        .audioCodec('pcm_s16le')
        .on('error', reject)
        .on('end', () => resolve(Buffer.concat(chunks)))
        .pipe()
        .on('data', (chunk: Buffer) => chunks.push(chunk));
    });
  };

  // Convert 16-bit PCM to Float32Array
  const convertToFloat32Array = (audioBuffer: Buffer<ArrayBufferLike>) => {
    const pcmData = new Int16Array(audioBuffer.buffer, audioBuffer.byteOffset, audioBuffer.byteLength / 2);
    const audioData = new Float32Array(pcmData.length);
    for (let i = 0; i < pcmData.length; i++) {
      audioData[i] = pcmData[i] / 32768.0;  // Normalize to [-1, 1]
    }
    return audioData
  }

  const generateAudioEmbedding = async (filePath: string): Promise<number[]> => {
    const { processor, audioModel } = modelInstance
    const audioBuffer = await readAndFormatAudioFile(filePath);
    const audioData = convertToFloat32Array(audioBuffer);

    const audioInputs = await processor(audioData);
    const { audio_embeds } = await audioModel(audioInputs);
    
    return Array.from(audio_embeds.data) as number[];
  };

  const generateTextEmbedding = async (text: string): Promise<number[]> => {
    const { tokenizer, textModel } = modelInstance
    const text_inputs = await tokenizer(text, { padding: true, truncation: true });
    const { text_embeds } = await textModel(text_inputs);
    
    return Array.from(text_embeds.data) as number[];
  };

  return {
    generateAudioEmbedding,
    generateTextEmbedding
  }; 
}

// State management through closure
