# 🚀 Quick Setup Guide for Interviewers

**Estimated Setup Time: 5 minutes**

---

## Prerequisites

- **Node.js** 18 or higher ([Download here](https://nodejs.org/))
- **npm** (comes with Node.js)
- **Gemini API Key** (free tier available)

---

## Step 1: Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/ai-knowledge-inbox.git
cd AI Knowledge Inbox
```

---

## Step 2: Get Your Gemini API Key (Free)

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click **"Create API Key"**
3. Copy the key (starts with `AIza...`)

> **Note**: The free tier includes 15 requests per minute, which is sufficient for testing this application.

---

## Step 3: Configure Environment


Edit `server/.env` and add your API key:
```env
PORT=5000
GEMINI_API_KEY=AIzaSy...  # Paste your key here
```

---

## Step 4: Install Dependencies

### Backend:
```bash
cd server
npm install
```

### Frontend (in a new terminal):
```bash
cd client
npm install
```

---

## Step 5: Start the Application

### Terminal 1 - Start Backend:
```bash
cd server
node index.js
```

You should see:
```
✅ Gemini Connected using model: gemini-2.5-flash
🚀 Knowledge Inbox Server ready at http://localhost:5000
```

### Terminal 2 - Start Frontend:
```bash
cd client
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

---

## Step 6: Open the Application

Visit **http://localhost:5173** in your browser.

---

## 🎯 Quick Test

1. **Add a note:**
   - Click **"Note"** tab
   - Type: `Machine learning is a subset of artificial intelligence`
   - Click **"Add"**
   - Wait for "Content ingested successfully"

2. **Ask a question:**
   - In the search box, type: `What is machine learning?`
   - Click **"Ask AI"**
   - You should get an answer with source citations

3. **Add a URL (optional):**
   - Click **"URL"** tab
   - Paste: `https://en.wikipedia.org/wiki/Machine_learning`
   - Click **"Add"** (this may take 10-15 seconds to scrape)

---

## 🔧 Troubleshooting

### Backend won't start
- **Issue**: Port 5000 already in use
- **Solution**: Change `PORT=5001` in `server/.env`

### "Could not connect to Gemini API"
- **Issue**: Invalid or missing API key
- **Solution**: 
  1. Verify your key in `server/.env`
  2. Ensure there are no extra spaces
  3. Try generating a new key at https://aistudio.google.com/app/apikey

### Frontend shows "Failed to fetch"
- **Issue**: Backend not running
- **Solution**: Start backend first (step 5)

### API quota exceeded
- **Issue**: Too many requests in short time
- **Solution**: 
  - Wait 1 minute and try again
  - Free tier: 15 requests/minute, 1500/day

---

## 📂 Project Structure

```
ai-knowledge-inbox/
├── client/              # React frontend (Vite)
├── server/              # Express backend
│   ├── routes/          # API endpoints
│   ├── services/        # RAG logic, scraping
│   └── index.js         # Entry point
├── README.md            # Full documentation
└── .env.example         # Template
```

---

## 📚 Additional Resources

- **Full Documentation**: See [README.md](README.md)
- **Architecture Details**: Check README for design decisions
- **API Documentation**: REST endpoints documented in README

---

## ✅ What to Expect

Once running, you can:
- ✅ Add text notes and URLs
- ✅ Ask natural language questions
- ✅ Get AI-powered answers with source citations
- ✅ View, edit, and delete saved items
- ✅ See clickable source citations

---

## 💬 Questions?

If you encounter any issues during setup:
1. Check the troubleshooting section above
2. Verify all prerequisites are installed
3. Ensure both backend and frontend are running

---

**Enjoy exploring the RAG pipeline!** 🧠
