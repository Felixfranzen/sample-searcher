import { dialog, ipcMain, IpcMainInvokeEvent } from "electron";
import { APIEvent } from "./api";
import { Service } from "./service/service";
import path from 'path'
import { createDragIcon } from "./utils/dragIcon";

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
      if (!dirPath) {
        throw new Error("Directory path is required");
      }
      console.log("Start analyzing: ", dirPath);
      await service.analyze(dirPath, (progressEvent) => {
        console.log(progressEvent, dirPath);
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

  ipcMain.handle(APIEvent.GET_DIRECTORIES, async () => {
    console.log('Getting directories')
    return service.getDirectories()
  })

  ipcMain.handle(APIEvent.ON_DRAG_FILE_START, (event, filePaths: string[]) => {
    if (filePaths.length === 0) { return; }
    const dragIcon = filePaths.length > 1
      ? createDragIcon(`${filePaths.length} files`)
      : createDragIcon(path.basename(filePaths[0]))

    event.sender.startDrag({
      file: filePaths[0],
      files: filePaths, // overrides .file if multiple files are provided
      icon: dragIcon,
    })
  })

};
