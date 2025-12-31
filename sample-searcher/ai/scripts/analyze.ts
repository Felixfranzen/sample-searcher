import fs from 'fs-extra';
import { analyze } from '../service';


const main = async () => {
  const audioDir = process.argv[2];
  
  if (!audioDir) {
    console.error('Please provide a directory path for audio files');
    process.exit(1);
  }
  
  if (!await fs.pathExists(audioDir)) {
    console.error(`Directory ${audioDir} does not exist`);
    process.exit(1);
  }
  
  const startTime = Date.now();
  
  await analyze({ audioDir, embeddingsOutputDir: 'output' })
  
  console.log('\nAnalysis complete!');
  console.log(`Duration: ${((Date.now() - startTime) / 1000).toFixed(2)}s`);
};

main().catch(console.error); 