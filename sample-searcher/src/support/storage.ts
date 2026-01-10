import Database from 'better-sqlite3'
import * as sqllitevec from 'sqlite-vec'
import path from 'path'
  

export const createDatabase = (userDataPath: any) => {
  // SETUP

  const dbPath = path.join(userDataPath, 'app.db')
  const db = new Database(dbPath)
  sqllitevec.load(db)

  db.exec(`
    DROP TABLE IF EXISTS files;
    DROP TABLE IF EXISTS vss_files;
    
    CREATE TABLE files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_path TEXT,
      embedding BLOB
    );

    CREATE VIRTUAL TABLE vss_files USING vec0(embedding float[512]);
  `);

  const result = db.prepare("SELECT vec_version() AS vec_version").get() as { vec_version: string };
  console.log('--- DB Setup Success ---')
  console.log(`sqlite-vec version: ${result.vec_version}`);
  console.log("file: ", userDataPath + '/app.db')
  console.log('----')


  // METHODS

  const saveFile = (filePath: string, embedding: number[]) => {
    const serializedEmbedding = serializeEmbedding(embedding)
    const info = db.prepare("INSERT INTO files (file_path, embedding) VALUES (?, ?)").run(filePath, serializedEmbedding)
    // TODO fix the rowid issue
    db.prepare("INSERT INTO vss_files (rowid, embedding) VALUES (1, ?)").run(serializedEmbedding)
  }

  const searchKNN = (embedding: number[], limit: number) => {
    const serializedEmbedding = serializeEmbedding(embedding)
    const similarFiles = db.prepare(`
      SELECT rowid, distance FROM vss_files WHERE embedding MATCH ? ORDER BY distance LIMIT ?
    `).all(serializedEmbedding, limit) as { rowid: number; distance: number }[];
    
    return similarFiles.map(({ rowid, distance }) => {
      const file = db.prepare("SELECT id, file_path FROM files WHERE id = ?").get(rowid) as { id: number, file_path: string };
      return { filePath: file.file_path, similarity: 1 - distance };
    });
  }

  return {
    saveFile, searchKNN
  }
} 


const serializeEmbedding = (embedding: number[] | Float32Array): Buffer  => {
  const buffer = Buffer.alloc(embedding.length * 4);
  for (let i = 0; i < embedding.length; i++) {
    buffer.writeFloatLE(embedding[i], i * 4);
  }
  return buffer;
}

const deserializeEmbedding = (buffer: Buffer): Float32Array => {
  const result = new Float32Array(buffer.length / 4);
  for (let i = 0; i < result.length; i++) {
    result[i] = buffer.readFloatLE(i * 4);
  }
  return result;
}