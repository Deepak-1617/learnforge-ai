# 📖 STEP-BY-STEP SETUP GUIDE

Follow these steps to get **COGNIXAR** (the AI Learning Platform) running locally.

---

## 📋 PREREQUISITES

- Python 3.8 or higher (`python --version`)
- A text editor (VS Code, Notepad++, etc.)
- Internet connection (for Groq API access)

---

## 🚀 STEP 1: GET YOUR FREE GROQ API KEY

Cognixar uses **Groq** (Llama 3.3 70B) — an extremely fast AI inference service with a generous free tier.

1. Go to: **https://console.groq.com/keys**
2. Sign in (Google / GitHub / email)
3. Click **Create API Key**
4. Copy the key (it starts with `gsk_...`)
5. **Save it somewhere safe!**

> Free tier offers very high throughput — way more than enough for personal study use.

---

## 🚀 STEP 2: INSTALL DEPENDENCIES

Open PowerShell or a terminal:

```bash
# Navigate to the backend folder
cd C:\Users\dando\ai-learning-platform\backend

# Create virtual environment (keeps dependencies isolated)
python -m venv venv

# Activate virtual environment (Windows)
venv\Scripts\activate
# or on Mac/Linux:
# source venv/bin/activate

# You should see (venv) at the start of your prompt now

# Install all required packages
pip install -r requirements.txt
```

Wait for installation to complete (1–3 minutes).

---

## 🚀 STEP 3: CONFIGURE YOUR API KEY

1. Create a new file called `.env` inside the `backend/` directory.
2. Add this single line (replace with your actual key):

```env
GROQ_API_KEY=gsk_your_actual_key_here
```

3. Save the file.

> The `.env` file is gitignored so your key is never committed.

---

## 🚀 STEP 4: START THE SERVER

In the same terminal (with `venv` activated):

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

You should see something like:

```
INFO:     Uvicorn running on http://0.0.0.0:8000
✅ Loaded environment from: .../backend/.env
✅ Groq AI initialized with model: llama-3.3-70b-versatile
✅ AI Engine Status: healthy
   Model: llama-3.3-70b-versatile
INFO:     Application startup complete.
```

**Keep this terminal open!** The server needs to keep running.

---

## 🚀 STEP 5: OPEN THE APP

In your browser, visit:

```
http://localhost:8000
```

The server will redirect you to `/app.html` — the main study app.

The marketing landing page is at `http://localhost:8000/index.html`.

---

## 🚀 STEP 6: TEST THE APPLICATION

### Upload a File

1. Drag-and-drop or click the upload area
2. Select `tests/sample.txt` (or any PDF / DOCX / TXT)
3. Wait for upload to complete — you'll see a preview of the extracted text

### Generate Content

1. Choose what you want to generate (Quiz, Flashcards, Tricks, Summary, Compare)
2. Click the **Generate** button
3. Wait 5–20 seconds while Groq processes your document
4. Browse your interactive results

### Try the Neural Tutor Chat

1. Open the chat panel
2. Ask questions like:
   - *"Summarize this section"*
   - *"Explain like I'm 5"*
   - *"Quiz me on this"*
   - *"Give 3 examples"*

The tutor uses your uploaded document as context.

---

## 🎯 EXPECTED OUTPUT

| Module | What You'll See |
|--------|-----------------|
| **Quiz** | 5–10 multiple-choice questions with explanations |
| **Flashcards** | 8+ flippable 3D cards (front: term, back: definition) |
| **Memory Tricks** | Mnemonics, acronyms, analogies, story methods |
| **Summary** | Title, paragraph summary, key points, concept definitions, difficulty |
| **Compare** | Two-concept side-by-side analysis with similarities/differences |

---

## 🔧 TROUBLESHOOTING

### Problem: `ModuleNotFoundError`
**Solution:** Make sure your virtual environment is activated:
```bash
venv\Scripts\activate
```
Re-run `pip install -r requirements.txt` if needed.

### Problem: `GROQ_API_KEY not found in environment variables`
**Solution:**
1. Confirm `backend/.env` exists
2. Confirm it contains `GROQ_API_KEY=gsk_...` (no quotes, no spaces around `=`)
3. Restart the server (Ctrl+C and re-run uvicorn)

### Problem: `AI not configured` (HTTP 503)
**Solution:**
1. Check the server log — look for `✅ Groq AI initialized`
2. If you see `unhealthy`, your key may be invalid or you may have hit a rate limit
3. Verify the key works at https://console.groq.com/playground

### Problem: `File not found` (HTTP 404)
**Solution:** Uploads are stored **in-memory only**. Restarting the server wipes them. Re-upload your file.

### Problem: `Cannot connect to backend`
**Solution:**
1. Make sure the server is running (check the uvicorn terminal)
2. If port 8000 is busy, try a different port:
   ```bash
   uvicorn app.main:app --reload --port 8001
   ```
   Then update the API base URL in the frontend (`frontend/js/api.js`) to match.

### Problem: AI responses are truncated or fragmented
**Solution:** The `generate.py` route currently caps processing at the first 2 chunks of a document to stay within rate limits. Tweak `chunks = chunks[:2]` in `backend/app/routes/generate.py` if you want more.

---

## 🔄 SWITCHING TO A DIFFERENT AI PROVIDER

The current backend is **Groq-only**. If you want to swap providers:

1. Modify `backend/app/services/ai_engine.py`
2. Replace `get_groq_client()` and `_generate()` with calls to your preferred SDK (OpenAI, Anthropic, Gemini, Ollama, etc.)
3. Update the model names (`PRIMARY_MODEL`, `FALLBACK_MODEL`)
4. Add the SDK to `requirements.txt`
5. Restart the server

The rest of the codebase only depends on `AIEngine` and the standalone helpers — no other files need changes.

---

## 📝 NEXT STEPS

Now that your platform is running:

1. **Try different files** — upload your textbooks, notes, articles
2. **Customize the UI** — edit `frontend/css/main.css` and `frontend/css/components.css`
3. **Tune AI prompts** — modify the prompts in `backend/app/services/*_generator.py`
4. **Add features** — see the "Future Enhancements" list in `README.md`

---

## 💡 TIPS FOR BEST RESULTS

- **File quality**: Clean, text-based PDFs work best (scanned-image PDFs won't extract well)
- **Chunk size**: Adjust `chunk_size` and `overlap` in `backend/app/services/chunker.py`
- **More questions**: Tweak `num_questions` in `quiz_generator.py` or the request payload
- **Faster processing**: Use smaller files or fewer content types per request

---

**🎉 You're all set! Cognixar is ready to amplify your learning.**
