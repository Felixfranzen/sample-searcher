import { dialog, ipcMain, IpcMainInvokeEvent, nativeImage } from "electron";
import { APIEvent } from "./api";
import { Service } from "./service/service";
import path from 'path'
import { createCanvas } from 'canvas';

/**
 * Creates a drag icon with the filename displayed
 */
function createDragIcon(filename: string): Electron.NativeImage {
  const padding = 8;
  const fontSize = 13;

  // Create a temporary canvas to measure text
  const tempCanvas = createCanvas(100, 100);
  const tempCtx = tempCanvas.getContext('2d');
  tempCtx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  const textWidth = tempCtx.measureText(filename).width;

  // Calculate canvas dimensions
  const width = textWidth + padding * 2;
  const height = fontSize + padding * 2;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Draw background with rounded corners
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.beginPath();
  ctx.roundRect(0, 0, width, height, 6);
  ctx.fill();

  // Draw filename
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.fillText(filename, padding, height / 2);

  // Convert canvas to NativeImage
  const buffer = canvas.toBuffer('image/png');
  return nativeImage.createFromBuffer(buffer);
}


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

  ipcMain.handle(APIEvent.GET_DIRECTORIES, async () => {
    console.log('Getting directories')
    return service.getDirectories()
  })

  ipcMain.handle(APIEvent.ON_DRAG_FILE_START, (event, filePath: string) => {
    console.log('Start drag', filePath)
    const filename = path.basename(filePath)
    const dragIcon = createDragIcon(filename)

    event.sender.startDrag({
      file: filePath,
      icon: dragIcon,
    })
  })

};
