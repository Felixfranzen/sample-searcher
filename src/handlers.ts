import { dialog, ipcMain, IpcMainInvokeEvent } from "electron";
import { APIEvent } from "./api";
import { Service } from "./service/service";

export const registerHandlers = ({ service }: { service: Service }) => {
  ipcMain.handle(APIEvent.OPEN_SELECT_FILE_DIALOG, async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ["openDirectory"],
    });
    return canceled ? [] : filePaths[0];
  });

  ipcMain.handle(
    APIEvent.START_ANALYSIS,
    async (event: IpcMainInvokeEvent, dirPath: string) => {
      console.log("Start analyzing: ", dirPath);
      await service.analyze(dirPath, (progressEvent) => {
        event.sender.send(APIEvent.ANALYSIS_PROGRESS, {
          directory: {
            path: dirPath,
            id: progressEvent.directoryId
          },
          analyzedFiles: progressEvent.analyzedFiles,
          totalFiles: progressEvent.totalFiles
        });
      });
    }
  );

  ipcMain.handle(APIEvent.SEARCH, async (_, query: string, limit: number) => {
    console.log("Search: ", query, limit);
    const result = await service.search(query, limit);
    return result;
  });

  ipcMain.handle(APIEvent.DELETE_DIRECTORY, (_: IpcMainInvokeEvent, directoryId: number) => {
    console.log('Deleting directory: ', directoryId)
    service.deleteDirectory(directoryId)
  })
};
