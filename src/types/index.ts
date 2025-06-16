export interface AudioEmbedding {
  filePath: string;
  embedding: number[];
  timestamp: number;
}

export interface AudioAnalysisResult {
  embeddings: AudioEmbedding[];
  metadata: {
    totalFiles: number;
    processedFiles: number;
    failedFiles: number;
    duration: number;
  };
} 