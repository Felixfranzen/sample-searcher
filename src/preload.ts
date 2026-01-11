import { ipcRenderer, contextBridge } from 'electron'
import { API, APIEvent } from './api'

const api: API = {
  openSelectFileDialog: async () => ipcRenderer.invoke(APIEvent.OPEN_SELECT_FILE_DIALOG),
  startAnalysis: async (path: string) => ipcRenderer.invoke(APIEvent.START_ANALYSIS, path),
  onAnalysisProgress: (callback: (progress: { directory: { id: number, path: string }, analyzedFiles: number, totalFiles: number }) => void) => {
    ipcRenderer.on(APIEvent.ANALYSIS_PROGRESS, (_, progress) => {
      callback(progress);
    });
  },
  search: async (query: string, resultsCount: number = 10) => ipcRenderer.invoke(APIEvent.SEARCH, query, resultsCount),
  deleteDirectory: (directoryId: number) => ipcRenderer.invoke(APIEvent.DELETE_DIRECTORY, directoryId)
}

contextBridge.exposeInMainWorld('api', api)