import path from 'path'
import { search } from '../service';

const main = async () => {
  const query = process.argv[2];
  const k = parseInt(process.argv[3] || '3');

  if (!query) {
    console.error('Please provide a search query');
    process.exit(1);
  }

  console.log(`\nSearching for: '${query}'`);

  try {
    const results = await search({ embeddingsDir: 'output', query, resultsCount: k })
    results.forEach((result, i) => {
      console.log(`${i + 1}. ${path.basename(result.filePath)}`);
      console.log(`   Similarity: ${result.similarity.toFixed(3)} (distance: ${result.distance.toFixed(3)})`);
      console.log('-'.repeat(50));
    })
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  }
};

main(); 