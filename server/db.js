const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'database.sqlite'));

function initDB() {
    // Items table: stores original note or URL info
    db.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL, -- 'note' or 'url'
      content TEXT NOT NULL,
      source TEXT, -- original URL or 'Note'
      title TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

    // Chunks table: stores text chunks and their embeddings
    db.exec(`
    CREATE TABLE IF NOT EXISTS chunks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id INTEGER,
      content TEXT NOT NULL,
      embedding BLOB, -- Stored as Float32Array
      FOREIGN KEY (item_id) REFERENCES items (id) ON DELETE CASCADE
    )
  `);

    console.log('Database initialized.');
}

module.exports = {
    db,
    initDB
};
