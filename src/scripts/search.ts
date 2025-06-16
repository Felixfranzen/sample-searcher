import fs from 'fs-extra';
import path from 'path';
import { ClapModel } from '../utils/clapModel';
import pkg from 'hnswlib-node';
const { HierarchicalNSW } = pkg;

async function main() {
  const query = process.argv[2];
  const k = parseInt(process.argv[3] || '5'); // Number of results to return, default 5

  if (!query) {
    console.error('Please provide a search query');
    process.exit(1);
  }

  // Load the vector store and embeddings
  const outputDir = path.join(process.cwd(), 'output');
  const vectorStorePath = path.join(outputDir, 'vector_store.bin');
  const embeddingsPath = path.join(outputDir, 'embeddings.json');

  if (!await fs.pathExists(vectorStorePath) || !await fs.pathExists(embeddingsPath)) {
    console.error('Vector store or embeddings not found. Please run analyze.ts first.');
    process.exit(1);
  }

  // Initialize components
  const clapModel = new ClapModel();
  const vectorStore = new HierarchicalNSW('cosine', 512);
  vectorStore.readIndexSync(vectorStorePath);
  const embeddings = await fs.readJson(embeddingsPath);

  // Generate text embedding
  console.log('Generating text embedding...');
  const textEmbedding = await clapModel.generateTextEmbedding(query);

  // Search for similar audio files
  console.log('Searching for similar audio files...');
  const { neighbors, distances } = vectorStore.searchKnn(textEmbedding, k);

  // Display results
  console.log('\nSearch Results:');
  console.log('---------------');
  for (let i = 0; i < neighbors.length; i++) {
    const idx = neighbors[i];
    const distance = distances[i];
    const audioFile = embeddings.embeddings[idx];
    const similarity = 1 - distance; // Convert distance to similarity score

    console.log(`\n${i + 1}. ${path.basename(audioFile.filePath)}`);
    console.log(`   Path: ${audioFile.filePath}`);
    console.log(`   Similarity: ${(similarity * 100).toFixed(2)}%`);
  }
}

main().catch(console.error); 