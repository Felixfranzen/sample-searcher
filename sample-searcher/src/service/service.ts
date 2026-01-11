import fs from "fs-extra";
import path from "path";
import { ClapModel } from './clapModel'
import { Repository } from "./storage";

const findAudioFiles = async (audioDirectory: string): Promise<string[]> => {
  const audioFiles: string[] = [];
  const supportedExtensions = [".wav", ".mp3", ".ogg", ".flac", ".m4a"];

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

export const createService = ({ model, repository }: { model: ClapModel, repository: Repository }) => {
  const analyze = async (path: string, onProgress: (event: { analyzedFiles: number, totalFiles: number }) => void) => {
    if (!(await fs.pathExists(path))) {
      throw new Error(`Directory ${path} does not exist`);
    }

    const audioFiles = await findAudioFiles(path);
    console.log(`Found ${audioFiles.length} audio files to process`);

    const directoryId = repository.insertDirectory(path)

    let analyzedCount = 0
    for (const filePath of audioFiles) {
      console.log(`Processing: ${filePath}`);
      const embedding = await model.generateAudioEmbedding(filePath);
      repository.upsertFile(directoryId, filePath, embedding);
      analyzedCount++
      onProgress({ analyzedFiles: analyzedCount, totalFiles: audioFiles.length })
    }
    console.log('Done!')
  };

  const search = async (
    query: string,
    limit: number
  ) => {
    const textEmbedding = await model.generateTextEmbedding(query);
    return repository.searchKNN(textEmbedding, limit);
  };

  return { analyze, search };
};

export type Service = ReturnType<typeof createService>