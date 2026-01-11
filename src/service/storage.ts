import Database from "better-sqlite3";
import * as sqllitevec from "sqlite-vec";
import path from "path";

export const createDatabase = (userDataPath: any) => {
  // SETUP
  // TODO keep tables on restart
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

  const result = db.prepare("SELECT vec_version() AS vec_version").get() as {
    vec_version: string;
  };
  console.log("--- DB Setup Success ---");
  console.log(`sqlite-vec version: ${result.vec_version}`);
  console.log("file: ", userDataPath + "/app.db");
  console.log("----");

  // METHODS

  const insertDirectory = (directoryPath: string) => {
    const result = db
      .prepare("INSERT INTO directories (directory_path) VALUES (?)")
      .run(directoryPath);

    return result.lastInsertRowid as number;
  };

  const upsertFile = (
    directoryId: number,
    filePath: string,
    embedding: number[]
  ) => {
    const serializedEmbedding = serializeEmbedding(embedding);

    db
      .prepare(
        `
          INSERT INTO files (file_path, embedding) 
          VALUES (?, ?)
          ON CONFLICT(file_path) DO UPDATE SET
              embedding = excluded.embedding
      `
      )
      .run(filePath, serializedEmbedding);

    // note: lastInsertedRowId doesn't work for upserts
    const { id: fileId } = db.prepare("SELECT id FROM files WHERE file_path = ?").get(filePath) as { id: number }

    // note: upserts not supported for the virtual vector tables
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

  const deleteDirectory = (directoryId: number) => {
    db.prepare("DELETE FROM directories WHERE id = ?").run(BigInt(directoryId))
    db.prepare("DELETE FROM file_directory_memberships WHERE directory_id = ?").run(BigInt(directoryId))
    // cleans up orphaned files
    db.prepare("DELETE FROM files WHERE id NOT IN (SELECT DISTINCT file_id FROM file_directory_memberships);").run()
    db.prepare("DELETE FROM vss_files WHERE rowid NOT IN (SELECT DISTINCT file_id FROM file_directory_memberships);").run()
  }

  const searchKNN = (embedding: number[], limit: number) => {
    const serializedEmbedding = serializeEmbedding(embedding);
    const similarFiles = db
      .prepare(
        `
      SELECT rowid, distance FROM vss_files WHERE embedding MATCH ? ORDER BY distance LIMIT ?
    `
      )
      .all(serializedEmbedding, limit) as { rowid: number; distance: number }[];
    
    console.log(similarFiles)
    return similarFiles.map(({ rowid, distance }) => {
      const file = db
        .prepare("SELECT id, file_path FROM files WHERE id = ?")
        .get(rowid) as { id: number; file_path: string };
      return { filePath: file.file_path, distance };
    });
  };

  return {
    insertDirectory,
    upsertFile,
    deleteDirectory,
    searchKNN,
  };
};

const serializeEmbedding = (embedding: number[] | Float32Array): Buffer => {
  const buffer = Buffer.alloc(embedding.length * 4);
  for (let i = 0; i < embedding.length; i++) {
    buffer.writeFloatLE(embedding[i], i * 4);
  }
  return buffer;
};

export type Repository = ReturnType<typeof createDatabase>;
