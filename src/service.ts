import fs from 'fs-extra'
import path from 'path'
import { createEmbeddingStorage } from './storage';
import { createClapModel } from './clapModel';
import { findAudioFiles } from './files';

export const analyze = async ({ audioDir, embeddingsOutputDir }: { audioDir: string, embeddingsOutputDir: string  }) => {        
    if (!await fs.pathExists(audioDir)) {
        throw new Error(`Directory ${audioDir} does not exist`);   
    }
    
    const storage = createEmbeddingStorage({ storageDir: embeddingsOutputDir })
    const model = await createClapModel()
    
    const audioFiles = await findAudioFiles(audioDir);
    console.log(`Found ${audioFiles.length} audio files to process`);

    for (const filePath of audioFiles) {
        console.log(`Processing: ${filePath}`)
        const embedding = await model.generateAudioEmbedding(filePath)
        storage.add({ filePath, embedding })
    }

    await storage.saveToDisc();
};

export const search = async ({ embeddingsDir, query, resultsCount }: { embeddingsDir: string, query: string, resultsCount: number }) => {

    const storage = createEmbeddingStorage({ storageDir: embeddingsDir });
    await storage.loadFromDisc();

    const model = await createClapModel()

    console.log(`Loaded index with ${storage.get().metadata.files.length} audio files`);

    const textEmbedding = await model.generateTextEmbedding(query);
    const { neighbors, distances } = storage.get().vectorStore.searchKnn(textEmbedding, resultsCount);

    return neighbors.map((idx, i) => {
        const distance = distances[i];
        const audioFile = storage.get().metadata.files[idx];
        const similarity = Math.max(0.0, 1.0 - (distance / 2.0));
        return { filePath: audioFile.filePath, distance, similarity }
    });
}