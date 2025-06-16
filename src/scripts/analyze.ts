import fs from 'fs-extra';
import path from 'path';
import { clapModel } from '../utils/clapModel';
import { AudioAnalysisResult, AudioMetadata } from '../types/index';
import pkg from 'hnswlib-node';
const { HierarchicalNSW } = pkg;

const findAudioFiles = async (audioDirectory: string): Promise<string[]> => {
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

const processAudioFile = async (
  filePath: string,
  vectorStore: any,
  result: AudioAnalysisResult
): Promise<void> => {
  try {
    console.log(`Processing ${filePath}...`);
    
    const embedding = await clapModel.generateAudioEmbedding(filePath);
    const audioMetadata: AudioMetadata = {
      filePath,
      timestamp: Date.now()
    };
    
    result.metadata.push(audioMetadata);
    vectorStore.addPoint(embedding, result.metadata.length - 1);
    result.stats.processedFiles++;
  } catch (error) {
    console.error(`Failed to process ${filePath}:`, error);
    result.stats.failedFiles++;
  }
};

const saveResults = async (
  result: AudioAnalysisResult,
  vectorStore: any,
  outputDir: string
): Promise<void> => {
  await fs.ensureDir(outputDir);
  
  await fs.writeJson(
    path.join(outputDir, 'metadata.json'),
    result,
    { spaces: 2 }
  );
  
  vectorStore.writeIndexSync(path.join(outputDir, 'vector_store.bin'));
};

const main = async () => {
  const startTime = Date.now();
  const audioDir = process.argv[2];

  if (!audioDir) {
    console.error('Please provide a directory path for audio files');
    process.exit(1);
  }

  if (!await fs.pathExists(audioDir)) {
    console.error(`Directory ${audioDir} does not exist`);
    process.exit(1);
  }

  const vectorStore = new HierarchicalNSW('cosine', 512);
  vectorStore.initIndex(1000);

  const audioFiles = await findAudioFiles(audioDir);
  const result: AudioAnalysisResult = {
    metadata: [],
    stats: {
      totalFiles: audioFiles.length,
      processedFiles: 0,
      failedFiles: 0,
      duration: 0
    }
  };

  console.log(`Found ${audioFiles.length} audio files to process`);

  for (const filePath of audioFiles) {
    await processAudioFile(filePath, vectorStore, result);
  }

  const outputDir = path.join(process.cwd(), 'output');
  await saveResults(result, vectorStore, outputDir);

  result.stats.duration = Date.now() - startTime;
  
  console.log('\nAnalysis complete!');
  console.log(`Processed ${result.stats.processedFiles} files`);
  console.log(`Failed ${result.stats.failedFiles} files`);
  console.log(`Duration: ${(result.stats.duration / 1000).toFixed(2)}s`);
  console.log(`Results saved to ${outputDir}`);
};

main().catch(console.error); 