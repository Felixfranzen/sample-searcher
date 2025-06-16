import fs from 'fs-extra';
import path from 'path';
import { AudioProcessor } from '../utils/audioProcessor';
import { ClapModel } from '../utils/clapModel';
import { AudioAnalysisResult, AudioEmbedding } from '../types/index';
import { HierarchicalNSW } from 'hnswlib-node';

async function findAudioFiles(dirPath: string): Promise<string[]> {
  const audioFiles: string[] = [];
  
  async function scanDirectory(currentPath: string) {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      
      if (entry.isDirectory()) {
        await scanDirectory(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (['.wav', '.mp3', '.ogg', '.flac', '.m4a'].includes(ext)) {
          audioFiles.push(fullPath);
        }
      }
    }
  }
  
  await scanDirectory(dirPath);
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
  const audioProcessor = new AudioProcessor();
  const clapModel = new ClapModel(path.join(__dirname, '../../assets/clap_model.onnx'));
  await clapModel.initialize();

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
      const audioData = await audioProcessor.processAudioFile(filePath);
      
      // Generate embedding
      const embedding = await clapModel.generateEmbedding(audioData);
      
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