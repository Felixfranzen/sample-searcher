import { dialog, IpcMain, ipcRenderer } from "electron"
import { Repository } from "../src/support/storage"

export enum APIEvent {
    OPEN_SELECT_FILE_DIALOG = 'OPEN_SELECT_FILE_DIALOG',
    START_ANALYSIS = 'START_ANALYSIS',
    ANALYSIS_PROGRESS = 'ANALYSIS_PROGRESS',
    SEARCH = 'SEARCH'
}

export const api = {
  openSelectFileDialog: async () => ipcRenderer.invoke(APIEvent.OPEN_SELECT_FILE_DIALOG),
  startAnalysis: async (filePaths: string) => ipcRenderer.invoke(APIEvent.START_ANALYSIS, filePaths),
  search: async (query: string, resultsCount: number = 10) => ipcRenderer.invoke(APIEvent.SEARCH, query, resultsCount),
}

export type Api = typeof api


export const registerHandlers = ({ database, ipcMain }: { database: Repository, ipcMain: IpcMain }) => {
  ipcMain.handle(APIEvent.OPEN_SELECT_FILE_DIALOG, async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openDirectory']
    })
    return canceled ? [] : filePaths[0]
  });

  ipcMain.handle(APIEvent.START_ANALYSIS, async (_, filePath: string) => {
    console.log(filePath)
  });

  ipcMain.handle(APIEvent.SEARCH, async (_, query: string, resultsCount: number) => {
  });
}