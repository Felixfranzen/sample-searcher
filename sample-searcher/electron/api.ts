export enum APIEvent {
    OPEN_SELECT_FILE_DIALOG = 'OPEN_SELECT_FILE_DIALOG',
    START_ANALYSIS = 'START_ANALYSIS',
    ANALYSIS_PROGRESS = 'ANALYSIS_PROGRESS',
    SEARCH = 'SEARCH'
}

export type API = {
  openSelectFileDialog: () => Promise<void>
  startAnalysis: (path: string) => Promise<void>
  search: (query: string, limit: number) => Promise<void>
}