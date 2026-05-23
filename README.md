# 📚 COGNIXAR — AI Learning Platform

> **Cognition. Amplified.**

A full-stack AI-powered learning platform that transforms uploaded documents (PDF, DOCX, TXT) into a complete interactive study kit — quizzes, flashcards, memory tricks, summaries, comparisons, and a context-aware AI tutor chat. Powered by **Groq's** ultra-fast Llama 3.3 70B inference.

## ✨ Features

- **📁 File Upload** — PDF, DOCX, or TXT
- **📝 AI Quiz Generator** — Multiple-choice questions with explanations + XP rewards
- **🃏 3D Flashcards** — Flip-to-reveal cards with spaced repetition
- **💡 Memory Tricks** — Mnemonics, acronyms, analogies, story methods
- **📋 AI Summaries** — Structured summary with key points, concepts, and difficulty rating
- **⚖️ Compare & Contrast** — Side-by-side concept analysis
- **🤖 Neural Tutor Chat** — Streaming SSE chat that uses your document as context
- **🎨 Cyberpunk UI** — Three.js background, GSAP animations, custom cursor, dark/light themes

---

## 🏗️ Project Structure

```
ai-learning-platform/
├── backend/
│   ├── app/
│   │   ├── main.py               # FastAPI entry point
│   │   ├── storage.py            # In-memory file storage
│   │   ├── routes/
│   │   │   ├── upload.py         # File upload endpoints
│   │   │   ├── generate.py       # Content generation endpoints
│   │   │   └── chat.py           # Neural Tutor (streaming SSE)
│   │   └── services/
│   │       ├── ai_engine.py      # ⭐ Groq AI wrapper (singleton)
│   │       ├── extractor.py      # Text extraction (PDF/DOCX/TXT)
│   │       ├── chunker.py        # Text chunking with overlap
│   │       ├── quiz_generator.py
│   │       ├── flashcard_generator.py
│   │       ├── tricks_generator.py
│   │       ├── summary_generator.py
│   │       └── compare_generator.py
│   ├── requirements.txt
│   ├── nixpacks.toml             # Deployment config
│   └── Procfile.txt
├── frontend/
│   ├── index.html                # Marketing landing page
│   ├── app.html                  # Main app (upload + study UI + chat)
│   ├── css/
│   └── js/
└── tests/
    └── sample.txt
```

---

## 🚀 Quick Start

### Step 1: Get a Groq API Key (FREE)

1. Visit https://console.groq.com/keys
2. Sign up / sign in
3. Click **Create API Key**
4. Copy the key (starts with `gsk_...`)

> Groq's free tier offers very generous rate limits and is ~10× faster than GPT-4.

### Step 2: Install Dependencies

```bash
cd ai-learning-platform/backend

# Create virtual environment (recommended)
python -m venv venv
venv\Scripts\activate          # Windows
# or: source venv/bin/activate # Mac/Linux

# Install packages
pip install -r requirements.txt
```

### Step 3: Configure Your API Key

Create a `.env` file in the `backend/` directory:

```env
GROQ_API_KEY=gsk_your_actual_key_here
```

### Step 4: Run the Server

```bash
# From backend/
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Expected output:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
✅ Loaded environment from: .../backend/.env
✅ Groq AI initialized with model: llama-3.3-70b-versatile
✅ AI Engine Status: healthy
```

### Step 5: Open the App

Visit:
```
http://localhost:8000
```

You'll be redirected to `app.html` (the main study app). The landing page is at `/index.html`.

---

## 🔌 API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Server health check |
| `/api` | GET | API info & feature list |
| `/api/providers` | GET | AI provider status |
| `/api/upload` | POST | Upload file (multipart/form-data) |
| `/api/files/{file_id}` | GET | Get file metadata |
| `/api/generate` | POST | Generate quiz/flashcards/tricks/summary/compare |
| `/api/generate/status` | GET | AI engine status |
| `/api/chat` | POST | Standard chat with Neural Tutor |
| `/api/chat/stream` | POST | Streaming chat (Server-Sent Events) |
| `/api/chat/health` | GET | Chat service health |

Interactive docs available at `/docs` (Swagger) and `/redoc`.

---

## 🧠 AI Engine

The platform uses **Groq** with the following models:

| Role | Model |
|------|-------|
| **Primary** | `llama-3.3-70b-versatile` |
| **Fallback** | `llama-3.1-8b-instant` |

The fallback kicks in automatically if the primary model is decommissioned, deprecated, or unavailable. All AI logic lives in [`backend/app/services/ai_engine.py`](backend/app/services/ai_engine.py) — a singleton `AIEngine` class plus standalone helper functions.

> **Want a different provider?** The codebase used to support multiple providers and could be extended again. The `AIEngine` class is the single integration point — swap the Groq client for another SDK and update `get_groq_client()` and `_generate()`.

---

## 📝 How It Works

1. **Upload** → User uploads a PDF/DOCX/TXT file
2. **Extract** → Text is extracted with `pdfplumber` / `python-docx` / plain read
3. **Store** → File text is kept in an in-memory dict, keyed by a UUID `file_id`
4. **Chunk** → Text is split into ~800-word chunks with overlap (currently capped at 2 chunks per request to stay friendly with rate limits)
5. **Generate** → Each chunk is sent to Groq for quiz/flashcards/tricks; full text (truncated) is used for summary and compare
6. **Merge** → Results from chunks are deduplicated and combined
7. **Display** → Frontend renders interactive components

---

## 🧪 Testing

Use the provided `tests/sample.txt` (educational content about photosynthesis):

1. Upload `tests/sample.txt` via the UI
2. Click **Generate All**
3. Expected output:
   - 5–10 quiz questions
   - 8+ flashcards
   - 5 memory tricks
   - 1 structured summary
   - 1 compare/contrast analysis

---

## 🛠️ Troubleshooting

| Problem | Solution |
|---------|----------|
| `GROQ_API_KEY not found` | Make sure `backend/.env` exists and contains `GROQ_API_KEY=gsk_...` |
| `AI not configured` (503) | The Groq health check failed — verify your key and network |
| `File not found` (404) | The upload dict is in-memory — restarting the server clears all uploads |
| `Cannot connect to backend` | Ensure server is running on port 8000 (or update API base URL in frontend) |
| Failed to parse JSON from AI | The `extract_json()` helper is robust, but try regenerating; very long documents are also truncated per generator |

---

## 🔒 Security Notes

- API keys live in `.env` (gitignored — never commit them)
- Keys are NEVER exposed to the frontend
- CORS is wide-open for development (`allow_origins=["*"]`) — restrict in production
- File uploads are validated by extension (`.pdf`, `.docx`, `.txt`)
- Uploaded text is held in memory only; nothing is persisted to disk or a database

---

## 📈 Future Enhancements

- [ ] Persistent storage (SQLite → PostgreSQL) — currently in-memory only
- [ ] User authentication
- [ ] Export quizzes / flashcards to PDF
- [ ] Refactor `app.html` (~11k lines) into modular files
- [ ] Process all chunks (not just first 2) with smarter rate-limiting
- [ ] Re-add multi-provider support (Gemini, OpenAI, local Ollama)

---

## 📄 License

MIT License — Feel free to use, modify, and learn from this project!

---

**Built with ❤️ using FastAPI + Vanilla JavaScript + Groq AI**
