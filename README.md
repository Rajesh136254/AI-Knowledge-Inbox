# 🧠 AI Knowledge Inbox

<div align="center">


![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![React](https://img.shields.io/badge/react-18.3.1-61dafb)

**A production-style RAG (Retrieval-Augmented Generation) application for intelligent knowledge management**

[Features](#-features) • [Demo](#-demo) • [Quick Start](#-quick-start) • [Architecture](#-architecture) • [API](#-api-documentation)

</div>

---

## 📋 Overview

AI Knowledge Inbox is a full-stack web application that demonstrates production-ready RAG implementation. It allows users to save notes and URLs, then ask natural language questions to retrieve contextually relevant answers powered by semantic search and Google's Gemini AI.

**Built for interview/portfolio demonstration** - showcases full-stack development, AI integration, system design, and production engineering principles.

---

## ✨ Features

### Core Capabilities
- 📝 **Text Notes**: Add and manage plain text knowledge entries
- 🔗 **URL Ingestion**: Automatically extract content from web pages
- 🔍 **Semantic Search**: Find relevant information using AI embeddings (not just keywords)
- 💬 **AI Q&A**: Get contextual answers with cited sources
- 🎯 **Source Citations**: Verify answers by viewing original content

### Technical Highlights
- ⚡ **RAG Pipeline**: Chunking → Embeddings → Vector Search → LLM Generation
- 🗃️ **Smart Chunking**: 800-character chunks with 150-char overlap for context continuity
- 🎨 **Premium UI**: Glassmorphism design with smooth animations
- 🔧 **Full CRUD**: Create, Read, Update, Delete operations
- 🌐 **Advanced Scraping**: 5-strategy HTML extraction for complex pages
- 🔄 **Hybrid Search**: Falls back to TF-IDF keyword search if embeddings fail

---

## 🎬 Demo

### Adding Content
1. Click **Note** tab → Enter text → Click **Add**
2. Click **URL** tab → Paste URL → App scrapes and indexes content

### Asking Questions
3. Type your question in the "Ask your knowledge base" field
4. Click **Ask AI** → Get contextual answer with sources
5. Click on any source citation to view full content

**Example Flow:**
```
1. Add URL: https://en.wikipedia.org/wiki/Machine_learning
2. Ask: "What is supervised learning?"
3. Get Answer: "Supervised learning is a machine learning approach..."
   └── Source: Machine learning - Wikipedia
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ and npm
- **Gemini API Key** (free tier available)

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/ai-knowledge-inbox.git
cd ai-knowledge-inbox

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install

# Configure environment
cd ../server
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
```

### Get Your Gemini API Key
1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the key to `server/.env`:
```env
GEMINI_API_KEY=AIzaSy...
PORT=5000
```

### Run the Application

**Option 1: Manual Start (Recommended for Development)**
```bash
# Terminal 1 - Start backend server
cd server
node index.js

# Terminal 2 - Start frontend
cd client
npm run dev
```

**Option 2: Quick Start (Windows)**
```bash
# From project root
setup.bat
```

**Access the App:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

---

## 🏗️ Architecture & Design Decisions

### Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Frontend** | React 18 + Vite | Fast HMR, modern hooks-based development |
| **Backend** | Node.js + Express | Lightweight, async-friendly for AI calls |
| **AI Model** | Gemini 2.5 Flash | State-of-the-art performance, low latency |
| **Embeddings** | Gemini text-embedding-004 | 768-dim vectors, optimized for retrieval |
| **Database** | SQLite + better-sqlite3 | Zero-config persistence, synchronous API |
| **Scraping** | Cheerio | Fast HTML parsing without browser overhead |

### RAG Pipeline

```
User Input
    ↓
┌─────────────────────────────────────────┐
│ 1. INGESTION                            │
│   • Fetch content (URL) or use note     │
│   • Extract text with 5-strategy scraper│
│   • Chunk into 800-char pieces          │
│   • Generate embeddings (768-dim)       │
│   • Store in SQLite with metadata       │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ 2. RETRIEVAL                            │
│   • Embed user question                 │
│   • Calculate cosine similarity         │
│   • Retrieve top-3 chunks (>0.3 score)  │
│   • Fallback to TF-IDF if needed        │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ 3. GENERATION                           │
│   • Build prompt with context           │
│   • Call Gemini 2.5 Flash               │
│   • Return answer + cited sources       │
└─────────────────────────────────────────┘
```

### Key Design Decisions

#### 1. **Chunking Strategy**
- **Approach**: 800 characters with 150-character overlap
- **Rationale**: 
  - Large enough to contain complete thoughts/facts
  - Small enough to fit LLM context windows efficiently
  - Overlap prevents key phrases from being split across chunks

#### 2. **Vector Storage**
- **Approach**: SQLite BLOB storage + in-memory cosine similarity
- **Rationale**:
  - Extremely fast for <10,000 chunks (sub-millisecond search)
  - Zero infrastructure overhead (no separate vector DB)
  - Full persistence without external dependencies
- **At Scale**: Would migrate to **pgvector** (Postgres) or **Qdrant** with HNSW indexing for millions of vectors

#### 3. **Synchronous Ingestion**
- **Current**: Blocking API calls during URL scraping
- **Rationale**: Simplicity for demo/portfolio project
- **Production**: Would use **Redis/BullMQ** job queue with progress tracking

#### 4. **Gemini Over OpenAI**
- **Choice**: Google Gemini 2.5 Flash
- **Rationale**:
  - State-of-the-art performance (benchmarks competitive with GPT-4)
  - Lower latency (~1-2s response time)
  - Generous free tier for development
- **Note**: RAG service is abstracted—swapping to OpenAI requires minimal changes

---

## 📡 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Endpoints

#### POST `/api/ingest`
Add a note or URL to the knowledge base.

**Request:**
```json
{
  "type": "note",        // or "url"
  "content": "Machine learning is a subset of AI..."
}
```

**Response:**
```json
{
  "message": "Content ingested successfully",
  "itemId": 1,
  "chunksCreated": 3
}
```

---

#### GET `/api/items`
List all saved items.

**Response:**
```json
[
  {
    "id": 1,
    "type": "url",
    "title": "Machine Learning - Wikipedia",
    "source": "https://en.wikipedia.org/wiki/Machine_learning",
    "content": "Machine learning (ML) is...",
    "created_at": "2026-01-16T18:30:00.000Z"
  }
]
```

---

#### POST `/api/query`
Ask a question and get an AI-generated answer.

**Request:**
```json
{
  "question": "What is supervised learning?"
}
```

**Response:**
```json
{
  "answer": "Supervised learning is a machine learning approach where...",
  "sources": [
    {
      "title": "Machine Learning - Wikipedia",
      "source": "https://en.wikipedia.org/wiki/Machine_learning",
      "content": "...excerpt from relevant chunk...",
      "item_id": 1
    }
  ]
}
```

---

#### DELETE `/api/items/:id`
Delete an item and its associated chunks.

**Response:**
```json
{
  "message": "Item deleted successfully"
}
```

---

#### PATCH `/api/items/:id`
Update item title and/or content (re-generates embeddings).

**Request:**
```json
{
  "title": "Updated Title",
  "content": "Updated content..."
}
```

**Response:**
```json
{
  "message": "Item updated successfully"
}
```

---

#### GET `/health`
Server health check.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-16T18:30:00.000Z"
}
```

---

#### GET `/health/gemini`
Check Gemini API connection status.

**Response:**
```json
{
  "status": "success",
  "model": "gemini-2.5-flash",
  "message": "Gemini connection successful"
}
```

---

## 🗂️ Project Structure

```
ai-knowledge-inbox/
├── client/                    # React frontend
│   ├── src/
│   │   ├── App.jsx           # Main component (UI + state)
│   │   ├── index.css         # Glassmorphism styling
│   │   └── main.jsx          # React entry point
│   ├── package.json
│   └── vite.config.js        # Vite config + proxy
│
├── server/                    # Express backend
│   ├── routes/
│   │   └── api.js            # API endpoints
│   ├── services/
│   │   ├── ragService.js     # RAG pipeline + AI logic
│   │   └── scraperService.js # URL content extraction
│   ├── db.js                 # Database initialization
│   ├── index.js              # Server entry point
│   ├── .env.example          # Environment template
│   ├── debug_db.js           # Dev tool: inspect database
│   ├── test_gemini.js        # Dev tool: test API connection
│   └── rebuild_chunks.js     # Dev tool: regenerate embeddings
│
├── .gitignore
├── LICENSE
├── README.md
├── INTERVIEW_ASSESSMENT.md   # Detailed analysis for interviews
└── setup.bat                 # Quick start script (Windows)
```

---

## 🧪 Development Tools

### Test Gemini Connection
```bash
cd server
node test_gemini.js
```
Verifies your API key and tests embeddings + chat.

### Inspect Database
```bash
cd server
node debug_db.js
```
Shows all items and chunks with metadata.

### Rebuild Embeddings
```bash
cd server
node rebuild_chunks.js
```
Re-generates embeddings for all existing items (useful after model changes).

---

## 🔒 Security & Best Practices

### What's Included ✅
- Environment variable isolation (`.env`)
- Input validation on all endpoints
- SQL injection protection (parameterized queries)
- Error handling with proper HTTP status codes
- CORS configuration
- Cascade deletion (chunks deleted with items)

### Production Enhancements (Not Implemented)
- ❌ Authentication/Authorization (single-user app)
- ❌ Rate limiting (trust environment)
- ❌ HTTPS/SSL (local development)
- ❌ Database encryption at rest
- ❌ API key rotation

> **Note**: This is a portfolio/interview project optimized for demonstration, not production deployment.

---

## 📈 Scalability Considerations

### Current Limitations
- **Vector Search**: In-memory cosine similarity (fast for <10K chunks)
- **Ingestion**: Synchronous URL scraping (blocks API thread)
- **Database**: SQLite (single-writer concurrency)
- **Storage**: No object storage for large files

### Production Migration Path

| Component | Current | At Scale (10K+ users) |
|-----------|---------|----------------------|
| **Vector DB** | SQLite BLOBs | pgvector or Qdrant with HNSW |
| **Job Queue** | Synchronous | Redis + BullMQ |
| **Database** | SQLite | PostgreSQL with read replicas |
| **Caching** | None | Redis for frequent queries |
| **Scraping** | In-process | Dedicated worker pool |
| **Auth** | None | OAuth2 + multi-tenancy |
| **Deployment** | Local | Kubernetes + auto-scaling |
| **Monitoring** | Console logs | Datadog / Prometheus |

**Estimated Capacity:**
- Current: ~500 concurrent users (SQLite limit)
- With pgvector + Redis: ~50K concurrent users
- With full Kubernetes: Horizontally scalable

---

## 🐛 Known Issues & Limitations

### API Quota Management
- **Issue**: Gemini free tier has usage limits (15 RPM, 1500 RPD)
- **Impact**: Adding large documents may fail with `429 Too Many Requests`
- **Workaround**: Use smaller notes, or upgrade to paid tier
- **Future**: Add exponential backoff + retry logic

### Delete Button Confusion
- **Issue**: Delete appears broken when items fail to save due to quota
- **Root Cause**: Items stuck in "Saving..." state never get an ID
- **Solution**: Better error messaging (not implemented to preserve original code)

### URL Scraping Limitations
- Some sites block automated scraping (403/401 errors)
- JavaScript-heavy SPAs may not render content
- Rate limits on popular sites (Wikipedia, etc.)

---

## 🧑‍💻 Development Workflow

### Adding a New Feature

1. **Backend First**: Add endpoint in `routes/api.js`
2. **Service Layer**: Implement logic in relevant service
3. **Frontend**: Update `App.jsx` with new UI
4. **Test Manually**: Use browser + Postman
5. **Document**: Update README if public-facing

### Code Quality Checklist
- ✅ No god files (largest file: 380 lines)
- ✅ Separation of concerns (routes → services → db)
- ✅ Clear naming (no abbreviations)
- ✅ Error handling with descriptive messages
- ✅ Structured logging

---

## 📚 Learning Resources

### RAG Concepts
- [LangChain RAG Guide](https://python.langchain.com/docs/use_cases/question_answering/)
- [Pinecone RAG Tutorial](https://www.pinecone.io/learn/retrieval-augmented-generation/)
- [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)

### Gemini API
- [Gemini Documentation](https://ai.google.dev/docs)
- [Text Embeddings Guide](https://ai.google.dev/docs/embeddings_guide)
- [Best Practices](https://ai.google.dev/docs/best_practices)

---

## 🤝 Contributing

This is a portfolio/interview project, but feedback is welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👤 Author

**Your Name**
- Portfolio: [yourportfolio.com](https://yourportfolio.com)
- LinkedIn: [linkedin.com/in/yourprofile](https://linkedin.com/in/yourprofile)
- GitHub: [@yourusername](https://github.com/yourusername)

---

## 🙏 Acknowledgments

- **Google AI** for the Gemini API and generous free tier
- **Vercel** for React + Vite ecosystem
- **Better-sqlite3** team for the excellent SQLite library
- Interview prep resources that inspired this architecture

---

<div align="center">

**⭐ If this project helped you in your interview prep, consider giving it a star!**

Made with ❤️ for developers learning RAG and full-stack AI

</div>
