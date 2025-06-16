import fs from 'fs-extra';
import path from 'path';
import { ClapModel } from '../utils/clapModel';
import pkg from 'hnswlib-node';
const { HierarchicalNSW } = pkg;

async function main() {
  const query = process.argv[2];
  const k = parseInt(process.argv[3] || '10'); // Number of results to return, default 10

  if (!query) {
    console.error('Please provide a search query');
    process.exit(1);
  }

  console.log(`\nSearching for: '${query}'`);

  try {
    // Load the vector store and metadata
    const outputDir = path.join(process.cwd(), 'output');
    const vectorStorePath = path.join(outputDir, 'vector_store.bin');
    const metadataPath = path.join(outputDir, 'metadata.json');

    if (!await fs.pathExists(vectorStorePath) || !await fs.pathExists(metadataPath)) {
      throw new Error('Vector store or metadata not found. Please run analyze.ts first.');
    }

    // Initialize components
    const clapModel = new ClapModel();
    const vectorStore = new HierarchicalNSW('cosine', 512);
    vectorStore.readIndexSync(vectorStorePath);
    const metadata = await fs.readJson(metadataPath);

    console.log(`Loaded index with ${metadata.metadata.length} audio files`);

    // Generate text embedding
    const textEmbedding = await clapModel.generateTextEmbedding(query);

    // Search for similar audio files
    const { neighbors, distances } = vectorStore.searchKnn(textEmbedding, k);

    // Display results
    console.log('\nTop 10 matches:');
    console.log('-'.repeat(50));
    for (let i = 0; i < neighbors.length; i++) {
      const idx = neighbors[i];
      const distance = distances[i];
      const audioFile = metadata.metadata[idx];
      // Convert cosine distance to similarity score (0 to 1 range)
      // Cosine distance of 0 means perfect similarity (1.0)
      // Cosine distance of 2 means perfect dissimilarity (0.0)
      const similarity = Math.max(0.0, 1.0 - (distance / 2.0));

      console.log(`${i + 1}. ${path.basename(audioFile.filePath)}`);
      console.log(`   Similarity: ${similarity.toFixed(3)} (distance: ${distance.toFixed(3)})`);
      console.log(`   ${similarity > 0.5 ? '✓' : '✗'} ${similarity > 0.5 ? 'Good match' : 'Poor match'}`);
      console.log('-'.repeat(50));
    }
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  }
}

main(); 