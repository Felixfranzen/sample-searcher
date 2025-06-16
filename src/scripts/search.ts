import fs from 'fs-extra';
import path from 'path';
import { clapModel } from '../utils/clapModel';
import pkg from 'hnswlib-node';
const { HierarchicalNSW } = pkg;

const loadResources = async () => {
  const outputDir = path.join(process.cwd(), 'output');
  const vectorStorePath = path.join(outputDir, 'vector_store.bin');
  const metadataPath = path.join(outputDir, 'metadata.json');

  if (!await fs.pathExists(vectorStorePath) || !await fs.pathExists(metadataPath)) {
    throw new Error('Vector store or metadata not found. Please run analyze.ts first.');
  }

  const vectorStore = new HierarchicalNSW('cosine', 512);
  vectorStore.readIndexSync(vectorStorePath);
  const metadata = await fs.readJson(metadataPath);

  return { vectorStore, metadata };
};

const displayResults = (neighbors: number[], distances: number[], metadata: any) => {
  console.log('\nTop 10 matches:');
  console.log('-'.repeat(50));
  
  neighbors.forEach((idx, i) => {
    const distance = distances[i];
    const audioFile = metadata.metadata[idx];
    const similarity = Math.max(0.0, 1.0 - (distance / 2.0));

    console.log(`${i + 1}. ${path.basename(audioFile.filePath)}`);
    console.log(`   Similarity: ${similarity.toFixed(3)} (distance: ${distance.toFixed(3)})`);
    console.log(`   ${similarity > 0.5 ? '✓' : '✗'} ${similarity > 0.5 ? 'Good match' : 'Poor match'}`);
    console.log('-'.repeat(50));
  });
};

const main = async () => {
  const query = process.argv[2];
  const k = parseInt(process.argv[3] || '10');

  if (!query) {
    console.error('Please provide a search query');
    process.exit(1);
  }

  console.log(`\nSearching for: '${query}'`);

  try {
    const { vectorStore, metadata } = await loadResources();
    console.log(`Loaded index with ${metadata.metadata.length} audio files`);

    const textEmbedding = await clapModel.generateTextEmbedding(query);
    const { neighbors, distances } = vectorStore.searchKnn(textEmbedding, k);

    displayResults(neighbors, distances, metadata);
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  }
};

main(); 