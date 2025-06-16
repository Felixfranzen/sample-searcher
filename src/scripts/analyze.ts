import fs from 'fs-extra';
import path from 'path';
import { ClapModel } from '../utils/clapModel';
import { AudioAnalysisResult, AudioEmbedding } from '../types/index';
import pkg from 'hnswlib-node';
const { HierarchicalNSW } = pkg;

async function findAudioFiles(audioDirectory: string): Promise<string[]> {
  const audioFiles: string[] = [];
  const supportedExtensions = ['.wav', '.mp3', '.ogg', '.flac', '.m4a'];

  async function scanDirectory(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // Recursively scan subdirectories
        await scanDirectory(fullPath);
      } else if (entry.isFile()) {
        // Check if the file has a supported audio extension
        const ext = path.extname(entry.name).toLowerCase();
        if (supportedExtensions.includes(ext)) {
          audioFiles.push(fullPath);
        }
      }
    }
  }

  await scanDirectory(audioDirectory);
  return audioFiles;
}

async function main() {
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

  // Initialize components
  const clapModel = new ClapModel();

  // Create vector store
  const vectorStore = new HierarchicalNSW('cosine', 512); // CLAP embeddings are 512-dimensional
  vectorStore.initIndex(1000); // Initial size, will grow as needed

  // Process files
  const audioFiles = await findAudioFiles(audioDir);
  const result: AudioAnalysisResult = {
    embeddings: [],
    metadata: {
      totalFiles: audioFiles.length,
      processedFiles: 0,
      failedFiles: 0,
      duration: 0
    }
  };

  console.log(`Found ${audioFiles.length} audio files to process`);

  for (const filePath of audioFiles) {
    try {
      console.log(`Processing ${filePath}...`);
      
      // Process audio file
      const embedding = await clapModel.generateEmbedding(filePath);

      // Store embedding
      const audioEmbedding: AudioEmbedding = {
        filePath,
        embedding,
        timestamp: Date.now()
      };
      
      result.embeddings.push(audioEmbedding);
      vectorStore.addPoint(embedding, result.embeddings.length - 1);
      
      result.metadata.processedFiles++;
    } catch (error) {
      console.error(`Failed to process ${filePath}:`, error);
      result.metadata.failedFiles++;
    }
  }

  // Save results
  const outputDir = path.join(process.cwd(), 'output');
  await fs.ensureDir(outputDir);
  
  // Save embeddings
  await fs.writeJson(
    path.join(outputDir, 'embeddings.json'),
    result,
    { spaces: 2 }
  );
  
  // Save vector store
  vectorStore.writeIndexSync(path.join(outputDir, 'vector_store.bin'));

  result.metadata.duration = Date.now() - startTime;
  
  console.log('\nAnalysis complete!');
  console.log(`Processed ${result.metadata.processedFiles} files`);
  console.log(`Failed ${result.metadata.failedFiles} files`);
  console.log(`Duration: ${(result.metadata.duration / 1000).toFixed(2)}s`);
  console.log(`Results saved to ${outputDir}`);
}

main().catch(console.error); 