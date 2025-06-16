export interface AudioMetadata {
  filePath: string;
  timestamp: number;
}

export interface AudioAnalysisResult {
  metadata: AudioMetadata[];
  stats: {
    totalFiles: number;
    processedFiles: number;
    failedFiles: number;
    duration: number;
  };
} 