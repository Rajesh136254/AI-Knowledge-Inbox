require('dotenv').config();
const { db } = require('./db');
const { chunkText, generateEmbedding } = require('./services/ragService');

/**
 * This script re-chunks all existing items with the new larger chunk size
 * Run this after changing chunk parameters in ragService.js
 */
async function rebuildChunks() {
    console.log("🔄 Starting to rebuild chunks with new parameters...\n");

    // Get all items
    const items = db.prepare('SELECT id, content, title FROM items').all();
    console.log(`Found ${items.length} items to process\n`);

    let totalChunksCreated = 0;
    let processedItems = 0;

    for (const item of items) {
        try {
            console.log(`Processing: ${item.title || 'Untitled'}`);

            // Delete old chunks for this item
            const deleteResult = db.prepare('DELETE FROM chunks WHERE item_id = ?').run(item.id);
            console.log(`  ❌ Deleted ${deleteResult.changes} old chunks`);

            // Create new chunks with updated size
            const chunks = chunkText(item.content);
            console.log(`  📦 Created ${chunks.length} new chunks`);

            // Generate embeddings and save
            for (const chunk of chunks) {
                const embedding = await generateEmbedding(chunk);
                const buffer = embedding ? Buffer.from(new Float32Array(embedding).buffer) : null;
                db.prepare('INSERT INTO chunks (item_id, content, embedding) VALUES (?, ?, ?)').run(
                    item.id,
                    chunk,
                    buffer
                );
            }

            totalChunksCreated += chunks.length;
            processedItems++;
            console.log(`  ✅ Successfully re-chunked\n`);

        } catch (error) {
            console.error(`  ❌ Error processing item ${item.id}:`, error.message);
        }
    }

    console.log(`\n🎉 Rebuild complete!`);
    console.log(`   Items processed: ${processedItems}/${items.length}`);
    console.log(`   Total chunks created: ${totalChunksCreated}`);
}

rebuildChunks()
    .then(() => {
        console.log("\n✅ All done! Your knowledge base has been optimized.");
        process.exit(0);
    })
    .catch(err => {
        console.error("\n❌ Error:", err);
        process.exit(1);
    });
