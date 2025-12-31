import { dialog, IpcMain, ipcRenderer } from "electron"

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


export const registerHandlers = (ipcMain: IpcMain) => {
  ipcMain.handle(APIEvent.OPEN_SELECT_FILE_DIALOG, async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openDirectory']
    })
    return canceled ? [] : filePaths[0]
  });

  ipcMain.handle(APIEvent.START_ANALYSIS, async (_, filePath: string) => {
    console.log('Starting analysis for:', filePath)
    // Lazy load AI service only when needed
    const { analyze } = await import('./ai/service.js')
    await analyze({ audioDir: filePath, embeddingsOutputDir: 'output' })
    console.log('Analysis complete!')
  });

  ipcMain.handle(APIEvent.SEARCH, async (_, query: string, resultsCount: number) => {
    console.log('Searching for:', query)
    // Lazy load AI service only when needed
    const { search } = await import('./ai/service.js')
    const results = await search({
      embeddingsDir: 'output',
      query,
      resultsCount
    })
    console.log(`Found ${results.length} results`)
    return results
  });
}