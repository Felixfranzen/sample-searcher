import fs from 'fs-extra'
import path from 'path'
import pkg from 'hnswlib-node';
const { HierarchicalNSW } = pkg;

type Metadata = {
    files: { filePath: string }[]
    stats: {
        totalFiles: number
    }
}

export const createEmbeddingStorage = (config: { storageDir: string }) => {
    let metadata: Metadata = {
        files: [],
        stats: {
            totalFiles: 0
        }
    }

    let vectorStore = new HierarchicalNSW('cosine', 512);
    vectorStore.initIndex(1000);

    const add = ({ filePath, embedding }: { filePath: string, embedding: number[] }) => {
        metadata.files.push({ filePath })
        vectorStore.addPoint(embedding, metadata.files.length - 1);
        metadata.stats.totalFiles = metadata.files.length
    }

    const saveToDisc = async () => {
        await fs.ensureDir(config.storageDir);
        await fs.writeJson(
            path.join(config.storageDir, 'metadata.json'),
            metadata,
            { spaces: 2 }
          );
          vectorStore.writeIndexSync(path.join(config.storageDir, 'vector_store.bin'));
    }

    const loadFromDisc = async () => {
        const outputDir = path.join(process.cwd(), config.storageDir);
        const vectorStorePath = path.join(outputDir, 'vector_store.bin');
        const metadataPath = path.join(outputDir, 'metadata.json');

        if (!await fs.pathExists(vectorStorePath) || !await fs.pathExists(metadataPath)) {
            throw new Error('Vector store or metadata not found. Please run analyze.ts first.');
        }
        
        vectorStore = new HierarchicalNSW('cosine', 512);
        vectorStore.readIndexSync(vectorStorePath);
        metadata = await fs.readJson(metadataPath);

        console.log()
    }

    const get = () => {
        return { metadata, vectorStore }
    }

    return { add, saveToDisc, loadFromDisc, get }
}