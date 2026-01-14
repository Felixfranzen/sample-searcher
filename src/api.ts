export enum APIEvent {
    OPEN_SELECT_FILE_DIALOG = 'OPEN_SELECT_FILE_DIALOG',
    START_ANALYSIS = 'START_ANALYSIS',
    ANALYSIS_PROGRESS = 'ANALYSIS_PROGRESS',
    SEARCH = 'SEARCH',
    DELETE_DIRECTORY = "DELETE_DIRECTORY",
    GET_DIRECTORIES = "GET_DIRECTORIES",
    ON_DRAG_FILE_START = "ON_DRAG_FILE_START"
}

export type API = {
  openSelectFileDialog: () => Promise<string>
  startAnalysis: (path: string) => Promise<void>
  search: (query: string, limit: number) => Promise<Array<{ filePath: string, distance: number }>>
  onAnalysisProgress: (callback: (progress: {
    directory: {
      path: string,
      id: number
    }
    analyzedFiles: number
    totalFiles: number
  }) => void) => void
  deleteDirectory: (directoryId: number) => void
  getDirectories: () => Promise<Array<{ id: number, path: string, totalFiles: number, analyzedFiles: number }>>

  startDragFile: (filePath: string) => void
}