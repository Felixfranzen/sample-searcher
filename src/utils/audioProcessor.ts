import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs-extra';
import path from 'path';

export class AudioProcessor {
  async convertToWav(inputPath: string): Promise<Float32Array> {
    // Create temp directory in project root if it doesn't exist
    const tempDir = path.join(process.cwd(), 'temp');
    await fs.ensureDir(tempDir);
    
    // Create a unique subdirectory for this conversion
    const uniqueTempDir = path.join(tempDir, `audio-processor-${Date.now()}`);
    await fs.ensureDir(uniqueTempDir);
    
    const outputPath = path.join(uniqueTempDir, `${path.parse(inputPath).name}.wav`);
    
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
    
    // Skip WAV header (44 bytes) and get only the audio data
    const audioData = buffer.slice(44);
    
    // Ensure the audio data length is a multiple of 4 (size of float32)
    const validLength = Math.floor(audioData.length / 4) * 4;
    const validAudioData = audioData.slice(0, validLength);
    
    // Convert to Float32Array
    const float32Array = new Float32Array(validAudioData.buffer.slice(
      validAudioData.byteOffset,
      validAudioData.byteOffset + validLength
    ));
    
    // Clean up the temporary directory and its contents
    await fs.remove(uniqueTempDir);
    
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