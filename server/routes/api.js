const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { scrapeUrl } = require('../services/scraperService');
const { chunkText, generateEmbedding, retrieveContext, askQuestion } = require('../services/ragService');

// POST /ingest - Add text or URL
router.post('/ingest', async (req, res) => {
    const { type, content } = req.body;

    if (!type || !content) {
        return res.status(400).json({ error: 'Type (note|url) and content are required.' });
    }

    try {
        let finalContent = content;
        let title = type === 'note' ? 'Text Note' : content;
        let source = type === 'note' ? 'Manual Input' : content;

        if (type === 'url') {
            const scraped = await scrapeUrl(content);
            finalContent = scraped.content;
            title = scraped.title;
            source = scraped.source;
        }

        // 2. Chunk content
        const chunks = chunkText(finalContent);

        if (chunks.length === 0) {
            return res.status(400).json({ error: 'No meaningful text could be extracted to save.' });
        }

        // 1. Save item metadata
        const info = db.prepare('INSERT INTO items (type, content, source, title) VALUES (?, ?, ?, ?)').run(type, finalContent, source, title);
        const itemId = info.lastInsertRowid;

        // 3. Generate embeddings and save chunks
        for (const chunk of chunks) {
            const embedding = await generateEmbedding(chunk);
            const buffer = embedding ? Buffer.from(new Float32Array(embedding).buffer) : null;
            db.prepare('INSERT INTO chunks (item_id, content, embedding) VALUES (?, ?, ?)').run(itemId, chunk, buffer);
        }

        res.status(201).json({
            message: 'Content ingested successfully',
            itemId,
            chunksCreated: chunks.length
        });
    } catch (error) {
        console.error('Ingestion error:', error);
        res.status(500).json({ error: 'Failed to ingest content: ' + error.message });
    }
});

// GET /items - List saved items
router.get('/items', (req, res) => {
    try {
        const items = db.prepare('SELECT id, type, title, source, content, created_at FROM items ORDER BY created_at DESC').all();
        res.json(items);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch items' });
    }
});

// POST /query - RAG Query
router.post('/query', async (req, res) => {
    const { question } = req.body;

    if (!question) {
        return res.status(400).json({ error: 'Question is required.' });
    }

    try {
        // 1. Retrieve top relevant chunks
        const contextChunks = await retrieveContext(question);

        if (contextChunks.length === 0) {
            return res.json({
                answer: "I couldn't find any relevant information in your saved notes. Try adding some content first!",
                sources: []
            });
        }

        // 2. Ask LLM
        const result = await askQuestion(question, contextChunks);

        res.json(result);
    } catch (error) {
        console.error('Query error:', error);
        res.status(500).json({ error: 'Failed to process query' });
    }
});

// DELETE /items/:id - Remove an item
router.delete('/items/:id', (req, res) => {
    const { id } = req.params;
    try {
        // Chunks will be deleted automatically due to ON DELETE CASCADE
        const result = db.prepare('DELETE FROM items WHERE id = ?').run(id);
        if (result.changes === 0) return res.status(404).json({ error: 'Item not found' });
        res.json({ message: 'Item deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete item' });
    }
});

// PATCH /items/:id - Update item title and/or content
router.patch('/items/:id', async (req, res) => {
    const { id } = req.params;
    const { title, content } = req.body;
    try {
        db.transaction(() => {
            if (title !== undefined) {
                db.prepare('UPDATE items SET title = ? WHERE id = ?').run(title, id);
            }

            if (content !== undefined) {
                // Update content
                db.prepare('UPDATE items SET content = ? WHERE id = ?').run(content, id);

                // Refresh chunks
                const chunks = chunkText(content);
                db.prepare('DELETE FROM chunks WHERE item_id = ?').run(id);

                // We can't easily do async inside a standard better-sqlite3 transaction 
                // but for a single item it's okay to run sequentially
            }
        })();

        // If content was updated, handle chunks outside transaction to allow async embeddings
        if (content !== undefined) {
            const chunks = chunkText(content);
            for (const chunk of chunks) {
                const embedding = await generateEmbedding(chunk);
                const buffer = embedding ? Buffer.from(new Float32Array(embedding).buffer) : null;
                db.prepare('INSERT INTO chunks (item_id, content, embedding) VALUES (?, ?, ?)').run(id, chunk, buffer);
            }
        }

        res.json({ message: 'Item updated successfully' });
    } catch (error) {
        console.error('Update error:', error);
        res.status(500).json({ error: 'Failed to update item' });
    }
});

module.exports = router;
