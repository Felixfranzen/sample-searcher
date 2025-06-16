import path from 'path';
import { createClapModel } from '../clapModel';
import { createEmbeddingStorage } from '../storage';

const main = async () => {
  const query = process.argv[2];
  const k = parseInt(process.argv[3] || '3');

  if (!query) {
    console.error('Please provide a search query');
    process.exit(1);
  }

  console.log(`\nSearching for: '${query}'`);

  try {
    const storage = createEmbeddingStorage({ outputDir: 'output' });
    await storage.loadFromDisc();

    const model = await createClapModel()

    console.log(`Loaded index with ${storage.get().metadata.files.length} audio files`);

    const textEmbedding = await model.generateTextEmbedding(query);
    const { neighbors, distances } = storage.get().vectorStore.searchKnn(textEmbedding, k);

    neighbors.map((idx, i) => {
      const distance = distances[i];
      const audioFile = storage.get().metadata.files[idx];
      const similarity = Math.max(0.0, 1.0 - (distance / 2.0));
  
      console.log(`${i + 1}. ${path.basename(audioFile.filePath)}`);
      console.log(`   Similarity: ${similarity.toFixed(3)} (distance: ${distance.toFixed(3)})`);
      console.log(`   ${similarity > 0.5 ? '✓' : '✗'} ${similarity > 0.5 ? 'Good match' : 'Poor match'}`);
      console.log('-'.repeat(50));
    });
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  }
};

main(); 