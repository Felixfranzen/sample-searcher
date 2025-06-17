import { dialog, IpcMain, ipcRenderer } from "electron"

export enum APIEvent {
    OPEN_SELECT_FILE_DIALOG = 'OPEN_SELECT_FILE_DIALOG',
    START_ANALYSIS = 'START_ANALYSIS',
    ANALYSIS_PROGRESS = 'ANALYSIS_PROGRESS'
}

export const api = {
  openSelectFileDialog: async () => ipcRenderer.invoke(APIEvent.OPEN_SELECT_FILE_DIALOG),
  startAnalysis: async (filePaths: string) => ipcRenderer.invoke(APIEvent.START_ANALYSIS, filePaths),
}
  
export type Api = typeof api


export const registerHandlers = (ipcMain: IpcMain) => {
  ipcMain.handle(APIEvent.OPEN_SELECT_FILE_DIALOG, async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({ 
      properties: ['openDirectory']
    })
    return canceled ? [] : filePaths[0]
  });

  ipcMain.handle(APIEvent.START_ANALYSIS, async (event, filePath: string) => {
    console.log('bro')
  });
}