const { db } = require('./db');

const itemsCount = db.prepare('SELECT COUNT(*) as count FROM items').get();
const chunksCount = db.prepare('SELECT COUNT(*) as count FROM chunks').get();

console.log('Items:', itemsCount.count);
console.log('Chunks:', chunksCount.count);

if (itemsCount.count > 0) {
    const items = db.prepare('SELECT * FROM items').all();
    console.log('Recent Item:', items[0].title);
}
