import { ipcMain, dialog, app, BrowserWindow } from "electron";
import { fileURLToPath } from "node:url";
import path$1 from "node:path";
import Database from "better-sqlite3";
import * as sqllitevec from "sqlite-vec";
import path from "path";
import fs from "fs-extra";
import ffmpeg from "fluent-ffmpeg";
import { AutoProcessor, ClapAudioModelWithProjection, AutoTokenizer, ClapTextModelWithProjection } from "@xenova/transformers";
var APIEvent = /* @__PURE__ */ ((APIEvent2) => {
  APIEvent2["OPEN_SELECT_FILE_DIALOG"] = "OPEN_SELECT_FILE_DIALOG";
  APIEvent2["START_ANALYSIS"] = "START_ANALYSIS";
  APIEvent2["ANALYSIS_PROGRESS"] = "ANALYSIS_PROGRESS";
  APIEvent2["SEARCH"] = "SEARCH";
  APIEvent2["DELETE_DIRECTORY"] = "DELETE_DIRECTORY";
  return APIEvent2;
})(APIEvent || {});
const registerHandlers = ({ service }) => {
  ipcMain.handle(APIEvent.OPEN_SELECT_FILE_DIALOG, async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ["openDirectory"]
    });
    return canceled ? [] : filePaths[0];
  });
  ipcMain.handle(
    APIEvent.START_ANALYSIS,
    async (event, dirPath) => {
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
  ipcMain.handle(APIEvent.SEARCH, async (_, query, limit) => {
    console.log("Search: ", query, limit);
    const result = await service.search(query, limit);
    console.log(result);
    return result;
  });
  ipcMain.handle(APIEvent.DELETE_DIRECTORY, (_, directoryId) => {
    console.log("Deleting directory: ", directoryId);
    service.deleteDirectory(directoryId);
  });
};
const createDatabase = (userDataPath) => {
  const dbPath = path.join(userDataPath, "app.db");
  const db = new Database(dbPath);
  sqllitevec.load(db);
  db.exec(`
    DROP TABLE IF EXISTS files;
    DROP TABLE IF EXISTS directories;
    DROP TABLE IF EXISTS file_directory_memberships;
    DROP TABLE IF EXISTS vss_files;
    
    CREATE TABLE files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_path TEXT UNIQUE,
      embedding BLOB
    );

    CREATE VIRTUAL TABLE vss_files USING vec0(embedding float[512] distance_metric=cosine);

    CREATE TABLE directories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      directory_path TEXT UNIQUE NOT NULL
    );

    CREATE TABLE file_directory_memberships (
      file_id INTEGER NOT NULL,
      directory_id INTEGER NOT NULL,
      PRIMARY KEY (file_id, directory_id)
      -- FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
      -- FOREIGN KEY (directory_id) REFERENCES directories(id) ON DELETE CASCADE
    );
  `);
  const result = db.prepare("SELECT vec_version() AS vec_version").get();
  console.log("--- DB Setup Success ---");
  console.log(`sqlite-vec version: ${result.vec_version}`);
  console.log("file: ", userDataPath + "/app.db");
  console.log("----");
  const insertDirectory = (directoryPath) => {
    const result2 = db.prepare("INSERT INTO directories (directory_path) VALUES (?)").run(directoryPath);
    return result2.lastInsertRowid;
  };
  const upsertFile = (directoryId, filePath, embedding) => {
    const serializedEmbedding = serializeEmbedding(embedding);
    db.prepare(
      `
          INSERT INTO files (file_path, embedding) 
          VALUES (?, ?)
          ON CONFLICT(file_path) DO UPDATE SET
              embedding = excluded.embedding
      `
    ).run(filePath, serializedEmbedding);
    const { id: fileId } = db.prepare("SELECT id FROM files WHERE file_path = ?").get(filePath);
    db.prepare("DELETE FROM vss_files WHERE rowid = ?").run(
      BigInt(fileId)
    );
    db.prepare("INSERT INTO vss_files (rowid, embedding) VALUES (?, ?)").run(
      BigInt(fileId),
      serializedEmbedding
    );
    db.prepare(
      "INSERT INTO file_directory_memberships (file_id, directory_id) VALUES (?, ?)"
    ).run(BigInt(fileId), BigInt(directoryId));
  };
  const deleteDirectory = (directoryId) => {
    db.prepare("DELETE FROM directories WHERE id = ?").run(BigInt(directoryId));
    db.prepare("DELETE FROM file_directory_memberships WHERE directory_id = ?").run(BigInt(directoryId));
    db.prepare("DELETE FROM files WHERE id NOT IN (SELECT DISTINCT file_id FROM file_directory_memberships);").run();
    db.prepare("DELETE FROM vss_files WHERE rowid NOT IN (SELECT DISTINCT file_id FROM file_directory_memberships);").run();
  };
  const searchKNN = (embedding, limit) => {
    const serializedEmbedding = serializeEmbedding(embedding);
    const similarFiles = db.prepare(
      `
      SELECT rowid, distance FROM vss_files WHERE embedding MATCH ? ORDER BY distance LIMIT ?
    `
    ).all(serializedEmbedding, limit);
    console.log(similarFiles);
    return similarFiles.map(({ rowid, distance }) => {
      const file = db.prepare("SELECT id, file_path FROM files WHERE id = ?").get(rowid);
      return { filePath: file.file_path, distance };
    });
  };
  return {
    insertDirectory,
    upsertFile,
    deleteDirectory,
    searchKNN
  };
};
const serializeEmbedding = (embedding) => {
  const buffer = Buffer.alloc(embedding.length * 4);
  for (let i = 0; i < embedding.length; i++) {
    buffer.writeFloatLE(embedding[i], i * 4);
  }
  return buffer;
};
const findAudioFiles = async (audioDirectory) => {
  const audioFiles = [];
  const supportedExtensions = [".wav", ".mp3", ".ogg", ".flac", ".m4a"];
  const scanDirectory = async (dir) => {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await scanDirectory(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (supportedExtensions.includes(ext)) {
          audioFiles.push(fullPath);
        }
      }
    }
  };
  await scanDirectory(audioDirectory);
  return audioFiles;
};
const createService = ({ model, repository }) => {
  const analyze = async (directoryPath, onProgress) => {
    if (!await fs.pathExists(directoryPath)) {
      throw new Error(`Directory ${directoryPath} does not exist`);
    }
    const audioFiles = await findAudioFiles(directoryPath);
    console.log(`Found ${audioFiles.length} audio files to process`);
    const directoryId = repository.insertDirectory(directoryPath);
    let analyzedCount = 0;
    for (const filePath of audioFiles) {
      console.log(`Processing: ${filePath}`);
      const embedding = await model.generateAudioEmbedding(filePath);
      repository.upsertFile(directoryId, filePath, embedding);
      analyzedCount++;
      onProgress({ directoryId, analyzedFiles: analyzedCount, totalFiles: audioFiles.length });
    }
    console.log("Done!");
  };
  const search = async (query, limit) => {
    const textEmbedding = await model.generateTextEmbedding(query);
    return repository.searchKNN(textEmbedding, limit);
  };
  const deleteDirectory = (directoryId) => {
    repository.deleteDirectory(directoryId);
  };
  return { analyze, search, deleteDirectory };
};
const createClapModel = async () => {
  const processor = await AutoProcessor.from_pretrained(
    "Xenova/clap-htsat-unfused"
  );
  const audioModel = await ClapAudioModelWithProjection.from_pretrained(
    "Xenova/clap-htsat-unfused"
  );
  const tokenizer = await AutoTokenizer.from_pretrained(
    "Xenova/clap-htsat-unfused"
  );
  const textModel = await ClapTextModelWithProjection.from_pretrained(
    "Xenova/clap-htsat-unfused"
  );
  const modelInstance = {
    processor,
    audioModel,
    tokenizer,
    textModel
  };
  const readAndFormatAudioFile = async (filePath) => {
    return new Promise((resolve, reject) => {
      const chunks = [];
      ffmpeg(filePath).toFormat("wav").audioFrequency(48e3).audioChannels(1).audioCodec("pcm_s16le").on("error", reject).on("end", () => resolve(Buffer.concat(chunks))).pipe().on("data", (chunk) => chunks.push(chunk));
    });
  };
  const convertToFloat32Array = (audioBuffer) => {
    const pcmData = new Int16Array(
      audioBuffer.buffer,
      audioBuffer.byteOffset,
      audioBuffer.byteLength / 2
    );
    const audioData = new Float32Array(pcmData.length);
    for (let i = 0; i < pcmData.length; i++) {
      audioData[i] = pcmData[i] / 32768;
    }
    return audioData;
  };
  const generateAudioEmbedding = async (filePath) => {
    const { processor: processor2, audioModel: audioModel2 } = modelInstance;
    const audioBuffer = await readAndFormatAudioFile(filePath);
    const audioData = convertToFloat32Array(audioBuffer);
    const audioInputs = await processor2(audioData);
    const { audio_embeds } = await audioModel2(audioInputs);
    return Array.from(audio_embeds.data);
  };
  const generateTextEmbedding = async (text) => {
    const { tokenizer: tokenizer2, textModel: textModel2 } = modelInstance;
    const text_inputs = await tokenizer2(text, {
      padding: true,
      truncation: true
    });
    const { text_embeds } = await textModel2(text_inputs);
    return Array.from(text_embeds.data);
  };
  return {
    generateAudioEmbedding,
    generateTextEmbedding
  };
};
const __dirname = path$1.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path$1.join(__dirname, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path$1.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path$1.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path$1.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win;
function createWindow() {
  win = new BrowserWindow({
    icon: path$1.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: path$1.join(__dirname, "preload.mjs")
    }
  });
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path$1.join(RENDERER_DIST, "index.html"));
  }
}
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
app.whenReady().then(async () => {
  const userDataPath = app.getPath("userData");
  const repository = createDatabase(userDataPath);
  console.log("--- database created");
  const model = await createClapModel();
  console.log("--- model created");
  const service = createService({ model, repository });
  console.log("--- service created");
  registerHandlers({ service });
  console.log("--- handlers registered");
  createWindow();
});
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
