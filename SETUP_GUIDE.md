# 📖 STEP-BY-STEP SETUP GUIDE

Follow these steps exactly to get your AI Learning Platform running.

---

## 📋 PREREQUISITES

- Python 3.8 or higher (check: `python --version`)
- A text editor (VS Code, Notepad++, etc.)
- Internet connection (for API access)

---

## 🚀 STEP 1: GET YOUR FREE API KEY

### For Google Gemini (RECOMMENDED - FREE)

1. Go to: https://makersuite.google.com/app/apikey
2. Click "Create API Key"
3. Select "Any application" or your Google Cloud project
4. Copy the API key (looks like: `AIzaSyD...`)
5. **Save it somewhere safe!**

**Note:** Gemini free tier allows 60 requests/minute - more than enough for learning!

---

## 🚀 STEP 2: INSTALL DEPENDENCIES

Open a terminal/PowerShell and run:

```bash
# Navigate to backend folder
cd C:\Users\dando\ai-learning-platform\backend

# Create virtual environment (keeps dependencies isolated)
python -m venv venv

# Activate virtual environment
venv\Scripts\activate

# You should see (venv) in your prompt now

# Install all required packages
pip install -r requirements.txt
```

Wait for installation to complete (may take 2-3 minutes).

---

## 🚀 STEP 3: CONFIGURE API KEY

1. Open the file: `backend\.env`
2. Replace `your_gemini_api_key_here` with your actual API key:

```env
GEMINI_API_KEY=AIzaSyD-your-actual-key-here
GEMINI_ENABLED=true
```

3. Save the file

---

## 🚀 STEP 4: START THE SERVER

In the same terminal (with venv activated):

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
✅ Gemini AI initialized
```

**Keep this terminal open!** The server needs to stay running.

---

## 🚀 STEP 5: OPEN THE FRONTEND

### Option A: Direct File (Easiest)

1. Navigate to: `C:\Users\dando\ai-learning-platform\frontend\`
2. Double-click `index.html`
3. It will open in your default browser

### Option B: Via Server (Recommended)

Open your browser and go to: `http://localhost:8000`

---

## 🚀 STEP 6: TEST THE APPLICATION

### Upload a File

1. Click "📁 Choose File" button
2. Select `tests/sample.txt` (or any PDF/DOCX/TXT file)
3. Wait for upload to complete
4. You should see a preview of the text

### Generate Content

1. Check the boxes for what you want:
   - ☑ Quiz (MCQs)
   - ☑ Flashcards
   - ☑ Learning Tricks
   - ☑ Summary
2. Click "✨ Generate All"
3. Wait 10-30 seconds (AI is processing!)
4. Scroll down to see your results!

---

## 🎯 EXPECTED OUTPUT

### Quiz Section
You'll see 5-10 multiple-choice questions like:
- "What is the primary function of chlorophyll?"
- Options A, B, C, D
- Click an option to check your answer
- Explanation appears below

### Flashcards Section
- Flip cards by clicking them
- Front: Question
- Back: Answer

### Learning Tricks Section
- Mnemonics (memory devices)
- Analogies (comparisons to familiar things)
- Simplifications (easy explanations)

### Summary Section
- Concise paragraph summary
- Bullet points of key takeaways

---

## 🔧 TROUBLESHOOTING

### Problem: "Module not found" error
**Solution:** Make sure virtual environment is activated:
```bash
venv\Scripts\activate
```

### Problem: "API key not valid"
**Solution:** 
1. Check `.env` file has correct key
2. Key should start with `AIzaSyD`
3. No extra spaces or quotes
4. Restart the server

### Problem: Frontend shows "AI not configured"
**Solution:**
1. Check server terminal for "✅ Gemini AI initialized"
2. If you see errors, check `.env` file
3. Restart the server

### Problem: "Cannot connect to backend"
**Solution:**
1. Make sure server is running (check terminal)
2. Port 8000 might be in use - try different port:
   ```bash
   uvicorn app.main:app --reload --port 8001
   ```
2. Update frontend `script.js` line 10:
   ```javascript
   const API_BASE_URL = 'http://localhost:8001/api';
   ```

---

## 🔄 HOW TO SWITCH AI PROVIDERS

### Switch to OpenAI

1. Edit `backend\.env`:
```env
GEMINI_ENABLED=false
OPENAI_API_KEY=sk-your-openai-key-here
OPENAI_ENABLED=true
```

2. Install OpenAI package:
```bash
pip install openai
```

3. Restart the server

### Switch to Local LLM (Ollama)

1. Install Ollama: https://ollama.ai
2. Download a model:
   ```bash
   ollama pull llama2
   ```

3. Edit `backend\.env`:
```env
GEMINI_ENABLED=false
OPENAI_ENABLED=false
LOCAL_LLM_ENABLED=true
```

4. Install requests:
```bash
pip install requests
```

5. Restart the server

---

## 📝 NEXT STEPS

Now that your platform is running:

1. **Try different files**: Upload your textbooks, notes, articles
2. **Customize the UI**: Edit `frontend/style.css` colors
3. **Adjust AI behavior**: Modify prompts in `services/*.py` files
4. **Add features**: See README.md for enhancement ideas

---

## 💡 TIPS FOR BEST RESULTS

- **File quality**: Clean, text-based PDFs work best
- **Chunk size**: Adjust in `chunker.py` if results are fragmented
- **More questions**: Change "3-5" to "5-10" in quiz_generator.py
- **Faster processing**: Use smaller files or fewer content types

---

**🎉 Congratulations! Your AI Learning Platform is ready to use!**
