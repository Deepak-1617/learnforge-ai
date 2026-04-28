# 📚 AI Learning Platform

A complete AI-powered learning platform that generates quizzes, flashcards, smart learning tricks, and summaries from uploaded documents (PDF, DOCX, TXT).

## ✨ Features

- **File Upload**: Upload PDF, DOCX, or TXT files
- **AI-Generated Content**:
  - 📝 Multiple-choice quizzes (with answers & explanations)
  - 🃏 Flashcards (flip-to-reveal format)
  - 💡 Learning tricks (mnemonics, analogies, simplifications)
  - 📋 Concise summaries with key points
- **AI Abstraction Layer**: Switch between Gemini, OpenAI, or Local LLM by changing just ONE file
- **Clean UI**: Simple, responsive frontend with no framework dependencies

---

## 🏗️ Project Structure

```
ai-learning-platform/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entry point
│   │   ├── routes/
│   │   │   ├── upload.py        # File upload endpoints
│   │   │   ├── generate.py      # Content generation endpoints
│   │   │   └── content.py       # Content retrieval endpoints
│   │   └── services/
│   │       ├── ai_engine.py     # ⭐ CORE: AI abstraction layer
│   │       ├── extractor.py     # Text extraction from files
│   │       ├── chunker.py       # Text chunking for AI processing
│   │       ├── quiz_generator.py
│   │       ├── flashcard_generator.py
│   │       ├── tricks_generator.py
│   │       └── summary_generator.py
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── script.js
└── tests/
    └── sample.txt
```

---

## 🚀 Quick Start

### Step 1: Install Dependencies

```bash
cd ai-learning-platform/backend

# Create virtual environment (recommended)
python -m venv venv
venv\Scripts\activate    # Windows
# or: source venv/bin/activate  # Mac/Linux

# Install packages
pip install -r requirements.txt
```

### Step 2: Configure AI Provider

1. Copy the example environment file:
   ```bash
   copy .env.example .env
   ```

2. Edit `.env` and add your API key:

   **For Gemini (FREE - Recommended):**
   ```env
   GEMINI_API_KEY=your_actual_api_key_here
   GEMINI_ENABLED=true
   OPENAI_ENABLED=false
   LOCAL_LLM_ENABLED=false
   ```

   Get your FREE Gemini API key: https://makersuite.google.com/app/apikey

### Step 3: Run the Server

```bash
# From backend directory
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Step 4: Open the Frontend

Open `frontend/index.html` in your browser, or visit:
```
http://localhost:8000
```

---

## 🔌 API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Check server status |
| `/api/providers` | GET | Get available AI providers |
| `/api/upload` | POST | Upload a file (multipart/form-data) |
| `/api/generate` | POST | Generate content from uploaded file |
| `/api/content/{file_id}` | GET | Get generated content |

---

## 🧠 AI Provider Switching

This is the KEY feature! To switch AI providers:

### Option 1: Gemini (Default, Free)
```env
GEMINI_ENABLED=true
OPENAI_ENABLED=false
LOCAL_LLM_ENABLED=false
```

### Option 2: OpenAI (Paid)
```env
GEMINI_ENABLED=false
OPENAI_API_KEY=sk-your-key-here
OPENAI_ENABLED=true
LOCAL_LLM_ENABLED=false
```

### Option 3: Local LLM (Ollama - Free)
```bash
# First, install Ollama: https://ollama.ai
ollama pull llama2
```
```env
GEMINI_ENABLED=false
OPENAI_ENABLED=false
LOCAL_LLM_ENABLED=true
LOCAL_LLM_MODEL=llama2
```

**That's it!** No other files need to change. The `ai_engine.py` handles everything.

---

## 📝 How It Works

1. **Upload** → User uploads a PDF/DOCX/TXT file
2. **Extract** → Text is extracted using appropriate library
3. **Chunk** → Text is split into 300-800 word chunks (with overlap)
4. **Process** → Each chunk is sent to AI for parallel processing
5. **Generate** → AI creates quizzes, flashcards, tricks, summary
6. **Merge** → Results from all chunks are combined and deduplicated
7. **Display** → Frontend shows interactive results

---

## 🧪 Testing

### Test with Sample File

1. Use the provided `tests/sample.txt` file
2. Upload it via the frontend
3. Click "Generate All"
4. Expected output:
   - 5-10 quiz questions
   - 10-15 flashcards
   - 5-8 learning tricks
   - 1 summary with key points

### Sample Test File Content

The `tests/sample.txt` contains educational content about photosynthesis - perfect for testing!

---

## 🛠️ Troubleshooting

### "No AI provider enabled"
- Check `.env` file has `GEMINI_ENABLED=true` (or your chosen provider)
- Verify API key is correct
- Restart the server after changing `.env`

### "Cannot connect to backend"
- Ensure server is running: `uvicorn app.main:app --reload`
- Check port 8000 is not blocked

### "Failed to parse JSON"
- This can happen if AI returns malformed responses
- Try regenerating or using a different chunk size

### File upload fails
- Check file is PDF, DOCX, or TXT format
- Ensure file is not password-protected
- For PDFs, make sure text is selectable (not scanned images)

---

## 🔒 Security Notes

- API keys are stored in `.env` (never committed to git)
- Keys are NEVER exposed to frontend
- CORS is open for development - restrict in production
- File uploads are validated for type

---

## 📈 Future Enhancements

- [ ] Database storage (SQLite → PostgreSQL)
- [ ] User authentication
- [ ] Export quizzes to PDF
- [ ] Spaced repetition for flashcards
- [ ] Progress tracking
- [ ] More AI providers (Anthropic, Cohere)

---

## 📄 License

MIT License - Feel free to use, modify, and learn from this project!

---

**Built with ❤️ using FastAPI + Vanilla JavaScript**
