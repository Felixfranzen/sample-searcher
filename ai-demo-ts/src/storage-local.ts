import fs from 'fs-extra'
import path from 'path'
import { cos_sim } from '@xenova/transformers';

type Metadata = {
    files: { filePath: string }[]
    stats: {
        totalFiles: number
    }
}

type StoredEmbedding = {
    embedding: number[]
    index: number
}

export const createEmbeddingStorage = (config: { storageDir: string }) => {
    let metadata: Metadata = {
        files: [],
        stats: {
            totalFiles: 0
        }
    }

    let embeddings: StoredEmbedding[] = []

    const add = ({ filePath, embedding }: { filePath: string, embedding: number[] }) => {
        metadata.files.push({ filePath })
        embeddings.push({
            embedding,
            index: metadata.files.length - 1
        })
        metadata.stats.totalFiles = metadata.files.length
    }

    const saveToDisc = async () => {
        await fs.ensureDir(config.storageDir);
        
        // Save metadata
        await fs.writeJson(
            path.join(config.storageDir, 'metadata.json'),
            metadata,
            { spaces: 2 }
        );
        
        // Save embeddings
        await fs.writeJson(
            path.join(config.storageDir, 'embeddings.json'),
            embeddings,
            { spaces: 2 }
        );
    }

    const loadFromDisc = async () => {
        const outputDir = path.join(process.cwd(), config.storageDir);
        const embeddingsPath = path.join(outputDir, 'embeddings.json');
        const metadataPath = path.join(outputDir, 'metadata.json');

        if (!await fs.pathExists(embeddingsPath) || !await fs.pathExists(metadataPath)) {
            throw new Error('Embeddings or metadata not found. Please run analyze.ts first.');
        }
        
        embeddings = await fs.readJson(embeddingsPath);
        metadata = await fs.readJson(metadataPath);

        console.log(`Loaded ${metadata.stats.totalFiles} embeddings from storage`);
    }

    // Search for similar embeddings
    const search = (queryEmbedding: number[], topK: number = 5) => {
        if (embeddings.length === 0) {
            return [];
        }

        // Convert query to tensor-like format for xenova
        const queryTensor = queryEmbedding;
        
        // Calculate similarities with all stored embeddings
        const similarities = embeddings.map((stored, idx) => {
            const storedTensor = stored.embedding;
            const similarity = cos_sim(queryTensor, storedTensor);
            
            return {
                index: stored.index,
                similarity: similarity, // Extract scalar value
                filePath: metadata.files[stored.index].filePath
            };
        });

        // Sort by similarity (descending) and return top K
        return similarities
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, topK);
    }

    // Create a mock vectorStore object that mimics hnswlib API
    const vectorStore = {
        searchKnn: (queryEmbedding: number[], k: number) => {
            if (embeddings.length === 0) {
                return { neighbors: [], distances: [] };
            }

            // Convert query to tensor-like format for xenova
            const queryTensor = queryEmbedding;
            
            // Calculate similarities with all stored embeddings
            const results = embeddings.map((stored, idx) => {
                const storedTensor = stored.embedding;
                const similarity = cos_sim(queryTensor, storedTensor);
                
                return {
                    index: stored.index,
                    similarity: similarity,
                    // Convert similarity to distance (1 - similarity for cosine)
                    distance: 1 - similarity
                };
            });

            // Sort by similarity (descending) / distance (ascending)
            const sorted = results
                .sort((a, b) => a.distance - b.distance)
                .slice(0, k);

            return {
                neighbors: sorted.map(r => r.index),
                distances: sorted.map(r => r.distance)
            };
        }
    };

    const get = () => {
        return { metadata, vectorStore }
    }

    return { add, saveToDisc, loadFromDisc, search, get }
}