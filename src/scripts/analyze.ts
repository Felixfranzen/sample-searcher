import fs from 'fs-extra';
import path from 'path';
import { createClapModel } from '../clapModel';
import { createEmbeddingStorage } from '../storage';
import { findAudioFiles } from '../files';

import pkg from 'hnswlib-node';
const { HierarchicalNSW } = pkg;


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
  
  const storage = createEmbeddingStorage({ outputDir: "./output" })
  const model = await createClapModel()
  
  const audioFiles = await findAudioFiles(audioDir);
  console.log(`Found ${audioFiles.length} audio files to process`);

  for (const filePath of audioFiles) {
    console.log(`Processing: ${filePath}`)
    const embedding = await model.generateAudioEmbedding(filePath)
    storage.add({ filePath, embedding })
  }

  storage.saveToDisc();
  
  console.log('\nAnalysis complete!');
  console.log(`Processed ${storage.get().metadata.stats.totalFiles} files`);
  console.log(`Duration: ${((Date.now() - startTime) / 1000).toFixed(2)}s`);
};

main().catch(console.error); 