import { ipcRenderer, contextBridge } from 'electron'
import { API, APIEvent } from './api'

const api: API = {
  openSelectFileDialog: async () => ipcRenderer.invoke(APIEvent.OPEN_SELECT_FILE_DIALOG),
  startAnalysis: async (path: string) => ipcRenderer.invoke(APIEvent.START_ANALYSIS, path),
  search: async (query: string, resultsCount: number = 10) => ipcRenderer.invoke(APIEvent.SEARCH, query, resultsCount),
}

contextBridge.exposeInMainWorld('api', api)