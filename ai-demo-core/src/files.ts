import fs from 'fs-extra';
import path from 'path';

export const findAudioFiles = async (audioDirectory: string): Promise<string[]> => {
    const audioFiles: string[] = [];
    const supportedExtensions = ['.wav', '.mp3', '.ogg', '.flac', '.m4a'];
  
    const scanDirectory = async (dir: string) => {
      const entries = await fs.readdir(dir, { withFileTypes: true });
  
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
  
        if (entry.isDirectory()) {
          await scanDirectory(fullPath);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (supportedExtensions.includes(ext)) {
            audioFiles.push(fullPath);
          }
        }
      }
    };
  
    await scanDirectory(audioDirectory);
    return audioFiles;
  };


  