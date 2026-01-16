require('dotenv').config();
const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/api');
const { initDB } = require('./db');
const { initGemini } = require('./services/ragService');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Database
initDB();

// Routes
app.use('/api', apiRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Gemini health check endpoint
app.get('/health/gemini', async (req, res) => {
    const { testGeminiConnection } = require('./services/ragService');
    const result = await testGeminiConnection();
    res.json(result);
});

const server = app.listen(PORT, () => {
    console.log(`🚀 Knowledge Inbox Server ready at http://localhost:${PORT}`);
    console.log(`Server is listening and will stay active...`);
    // Start Gemini connection check AFTER server is successfully listening
    initGemini().catch(err => console.error("Gemini Error:", err.message));
});

// Prevent server from closing unexpectedly
server.on('close', () => {
    console.log('⚠️ Server is closing...');
});

process.on('exit', (code) => {
    console.log(`⚠️ Process is exiting with code: ${code}`);
});

process.on('uncaughtException', (err) => {
    console.error('💥 Uncaught Exception:', err.message);
    console.error(err.stack);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
});

// Keep-alive heartbeat (optional safety check)
setInterval(() => {
    // This keeps the event loop active
}, 60000);
