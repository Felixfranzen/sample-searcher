import { dialog, IpcMain, ipcRenderer } from "electron"

export enum APIEvent {
    OPEN_SELECT_FILE_DIALOG = 'OPEN_SELECT_FILE_DIALOG',
    START_ANALYSIS = 'START_ANALYSIS',
    ANALYSIS_PROGRESS = 'ANALYSIS_PROGRESS'
}

export const api = {
  openSelectFileDialog: async () => ipcRenderer.invoke(APIEvent.OPEN_SELECT_FILE_DIALOG),
  startAnalysis: async (filePaths: string[]) => ipcRenderer.invoke(APIEvent.START_ANALYSIS, filePaths),
  onAnalysisProgress: (callback: (filePath: string) => void) => {
    // Use a wrapper function to avoid exposing ipcRenderer directly
    const subscription = (_event: any, filePath: string) => callback(filePath)
    ipcRenderer.on(APIEvent.ANALYSIS_PROGRESS, subscription)
    return () => {
      ipcRenderer.removeListener(APIEvent.ANALYSIS_PROGRESS, subscription)
    }
  }
}
  
export type Api = typeof api


export const registerHandlers = (ipcMain: IpcMain) => {
  ipcMain.handle(APIEvent.OPEN_SELECT_FILE_DIALOG, async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({ 
      properties: ['openFile', 'openDirectory', 'multiSelections']
    })
    return canceled ? [] : filePaths
  });

  ipcMain.handle(APIEvent.START_ANALYSIS, async (event, filePaths: string[]) => {
    try {
      // Simulate processing each file
      for (const filePath of filePaths) {
        // Send progress update using webContents.send
        event.sender.send(APIEvent.ANALYSIS_PROGRESS, filePath)
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
      
      return { success: true }
    } catch (error) {
      console.error('Analysis error:', error)
      throw error // Re-throw to be handled by the renderer
    }
  });
}