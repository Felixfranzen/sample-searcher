export enum APIEvent {
    OPEN_SELECT_FILE_DIALOG = 'OPEN_SELECT_FILE_DIALOG',
    START_ANALYSIS = 'START_ANALYSIS',
    ANALYSIS_PROGRESS = 'ANALYSIS_PROGRESS',
    SEARCH = 'SEARCH'
}

export type API = {
  openSelectFileDialog: () => Promise<string>
  startAnalysis: (path: string) => Promise<void>
  search: (query: string, limit: number) => Promise<Array<{ filePath: string, similarity: number }>>
}