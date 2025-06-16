import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs-extra';
import path from 'path';

export class AudioProcessor {
  async convertToWav(inputPath: string): Promise<Float32Array> {
    const outputPath = path.join(path.dirname(inputPath), `${path.parse(inputPath).name}.wav`);
    
    // Convert to WAV format with specific parameters for CLAP
    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .audioFrequency(48000)  // Sample rate
        .audioChannels(1)       // Mono
        .audioCodec('pcm_f32le') // Float32 format
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .save(outputPath);
    });

    // Read the converted file
    const buffer = await fs.readFile(outputPath);
    
    // Convert to Float32Array
    const float32Array = new Float32Array(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
    
    // Clean up the temporary WAV file
    await fs.remove(outputPath);
    
    return float32Array;
  }

  async processAudioFile(filePath: string): Promise<Float32Array> {
    try {
      return await this.convertToWav(filePath);
    } catch (error) {
      console.error(`Error processing audio file ${filePath}:`, error);
      throw error;
    }
  }
} 