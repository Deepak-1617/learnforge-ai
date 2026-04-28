// ============================================
// 3D PARTICLE SYSTEM
// ============================================
(function initParticles() {
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let W = window.innerWidth;
    let H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;

    window.addEventListener('resize', () => {
        W = window.innerWidth;
        H = window.innerHeight;
        canvas.width = W;
        canvas.height = H;
    });

    const PARTICLE_COUNT = 80;
    const particles = [];
    let mouse = { x: W / 2, y: H / 2 };

    window.addEventListener('mousemove', e => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });

    const colors = ['#7c5cff', '#00d4ff', '#00e5a0', '#b44fff', '#ff6eb4'];

    class Particle {
        constructor() { this.reset(); }
        reset() {
            this.x = Math.random() * W;
            this.y = Math.random() * H;
            this.z = Math.random() * 3 + 0.5;
            this.vx = (Math.random() - 0.5) * 0.4;
            this.vy = (Math.random() - 0.5) * 0.4;
            this.r = (Math.random() * 2 + 0.5) * this.z * 0.5;
            this.color = colors[Math.floor(Math.random() * colors.length)];
            this.alpha = Math.random() * 0.5 + 0.1;
            this.pulse = Math.random() * Math.PI * 2;
        }
        update() {
            this.pulse += 0.02;
            const dx = mouse.x - this.x;
            const dy = mouse.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 150) {
                this.vx -= dx * 0.0003;
                this.vy -= dy * 0.0003;
            }
            this.vx *= 0.99;
            this.vy *= 0.99;
            this.x += this.vx;
            this.y += this.vy;
            if (this.x < 0 || this.x > W || this.y < 0 || this.y > H) this.reset();
        }
        draw() {
            const a = this.alpha * (0.7 + 0.3 * Math.sin(this.pulse));
            ctx.save();
            ctx.globalAlpha = a;
            ctx.shadowBlur = 10 * this.z;
            ctx.shadowColor = this.color;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push(new Particle());
    }

    function drawConnections() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 120) {
                    ctx.save();
                    ctx.globalAlpha = (1 - dist / 120) * 0.15;
                    ctx.strokeStyle = particles[i].color;
                    ctx.lineWidth = 0.5;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                    ctx.restore();
                }
            }
        }
    }

    function animate() {
        ctx.clearRect(0, 0, W, H);
        drawConnections();
        particles.forEach(p => { p.update(); p.draw(); });
        requestAnimationFrame(animate);
    }

    animate();
})();

/**
 * LearnForge AI - script.js
 * Complete version with Compare & Contrast feature
 */

const API_BASE_URL = 'https://learnforge-ai.onrender.com/api';

// State
let currentFileId = null;
let currentResults = null;
let selectedDifficulty = 'medium';
let quizScore = { correct: 0, total: 0 };
let msgInterval = null;
let previewOpen = true;

const funMessages = [
    "🤖 AI is reading your document...",
    "🧠 Extracting key concepts...",
    "📚 Building your quiz questions...",
    "🃏 Crafting perfect flashcards...",
    "💡 Discovering learning tricks...",
    "⚖️ Finding comparisons & contrasts...",
    "⚡ Running at Groq speed...",
    "🎯 Almost there, hang tight...",
    "✨ Sprinkling intelligence...",
    "🎓 Your study kit is almost ready!"
];

// ============================================
// INIT
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    checkAIStatus();
    setupFileInput();
    setupDragDrop();
    loadTheme();
});

// ============================================
// THEME
// ============================================
function loadTheme() {
    const t = localStorage.getItem('lf-theme') || 'light';
    document.documentElement.setAttribute('data-theme', t);
    document.getElementById('theme-icon').textContent = t === 'dark' ? '☀️' : '🌙';
}

function toggleTheme() {
    const cur = document.documentElement.getAttribute('data-theme');
    const nxt = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', nxt);
    localStorage.setItem('lf-theme', nxt);
    document.getElementById('theme-icon').textContent = nxt === 'dark' ? '☀️' : '🌙';
}

// ============================================
// AI STATUS
// ============================================
async function checkAIStatus() {
    try {
        const res = await fetch(`${API_BASE_URL}/providers`);
        const data = await res.json();
        const dot = document.getElementById('status-dot');
        const txt = document.getElementById('ai-status');
        if (data.available) {
            dot.className = 'ai-dot ready';
            txt.textContent = `${data.current} • ${data.model}`;
        } else {
            dot.className = 'ai-dot error';
            txt.textContent = 'AI not configured';
        }
    } catch {
        document.getElementById('status-dot').className = 'ai-dot error';
        document.getElementById('ai-status').textContent = 'Server offline';
    }
}

// ============================================
// DIFFICULTY
// ============================================
function setDifficulty(level, btn) {
    selectedDifficulty = level;
    document.querySelectorAll('.pill').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

// ============================================
// FILE INPUT
// ============================================
function setupFileInput() {
    document.getElementById('file-input').addEventListener('change', e => {
        const file = e.target.files[0];
        if (file) uploadFile(file);
    });
}

// ============================================
// DRAG & DROP
// ============================================
function setupDragDrop() {
    const zone = document.getElementById('drop-zone');
    zone.addEventListener('dragover', e => {
        e.preventDefault();
        zone.classList.add('drag-over');
    });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', e => {
        e.preventDefault();
        zone.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file) uploadFile(file);
    });
}

// ============================================
// UPLOAD
// ============================================
async function uploadFile(file) {
    const allowed = ['.pdf', '.docx', '.txt'];
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!allowed.includes(ext)) {
        showError('Invalid file type. Please upload PDF, DOCX, or TXT.');
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
        const res = await fetch(`${API_BASE_URL}/upload`, {
            method: 'POST',
            body: formData
        });
        const data = await res.json();

        if (res.ok && data.success) {
            currentFileId = data.file_id;
            document.getElementById('file-name').textContent = data.filename;
            document.getElementById('char-count').textContent =
                `${data.char_count.toLocaleString()} characters extracted`;
            document.getElementById('file-info-bar').classList.remove('hidden');
            document.getElementById('file-preview').textContent = data.preview;
            document.getElementById('preview-section').classList.remove('hidden');
            document.getElementById('generate-section').classList.remove('hidden');
            hideError();
        } else {
            showError(data.detail || 'Upload failed');
        }
    } catch (err) {
        showError(`Upload error: ${err.message}`);
    }
}

// ============================================
// PREVIEW TOGGLE
// ============================================
function togglePreview() {
    previewOpen = !previewOpen;
    const body = document.getElementById('preview-body');
    const icon = document.getElementById('preview-toggle-icon');
    body.style.display = previewOpen ? 'block' : 'none';
    icon.textContent = previewOpen ? '▼' : '▶';
}

// ============================================
// GENERATE
// ============================================
document.getElementById('generate-btn').addEventListener('click', async () => {
    if (!currentFileId) { showError('Please upload a file first.'); return; }

    const types = [];
    if (document.getElementById('opt-quiz').checked) types.push('quiz');
    if (document.getElementById('opt-flashcards').checked) types.push('flashcards');
    if (document.getElementById('opt-tricks').checked) types.push('tricks');
    if (document.getElementById('opt-summary').checked) types.push('summary');
    types.push('compare'); // Always generate compare

    if (types.length === 1) { showError('Select at least one content type.'); return; }

    const contentType = 'all';

    // UI start
    const btn = document.getElementById('generate-btn');
    btn.disabled = true;
    btn.innerHTML = '<span class="btn-generate-icon">⏳</span> Generating...';
    document.getElementById('generate-progress').classList.remove('hidden');
    document.getElementById('results-section').classList.add('hidden');
    quizScore = { correct: 0, total: 0 };
    hideError();

    startProgress(types);

    try {
        const res = await fetch(`${API_BASE_URL}/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                file_id: currentFileId,
                content_type: contentType,
                custom_prompt: `Difficulty: ${selectedDifficulty}`
            })
        });

        const data = await res.json();
        stopProgress();
        completeProgress();

        btn.disabled = false;
        btn.innerHTML = '<span class="btn-generate-icon">✨</span> Generate My Study Kit';
        setTimeout(() => document.getElementById('generate-progress').classList.add('hidden'), 1500);

        if (res.ok && data.success) {
            currentResults = data;
            displayResults(data, types);
        } else {
            showError(data.detail || 'Generation failed.');
        }
    } catch (err) {
        stopProgress();
        btn.disabled = false;
        btn.innerHTML = '<span class="btn-generate-icon">✨</span> Generate My Study Kit';
        document.getElementById('generate-progress').classList.add('hidden');
        showError(`Error: ${err.message}`);
    }
});

// ============================================
// PROGRESS ANIMATION
// ============================================
function startProgress(types) {
    let pct = 0;
    const fill = document.getElementById('gen-progress-fill');
    const pctEl = document.getElementById('gen-percent');
    const label = document.getElementById('progress-label');
    const funEl = document.getElementById('fun-message');
    let msgIdx = 0;
    let stepIdx = 0;

    const allSteps = ['quiz', 'flashcards', 'tricks', 'summary', 'compare'];

    // Reset all steps
    allSteps.forEach(t => {
        const step = document.getElementById(`gstep-${t}`);
        const status = document.getElementById(`pstatus-${t}`);
        if (step) { step.classList.remove('done', 'active'); }
        if (status) status.textContent = 'Waiting...';
    });

    const interval = setInterval(() => {
        if (stepIdx < allSteps.length) {
            const t = allSteps[stepIdx];
            if (stepIdx > 0) {
                const prev = allSteps[stepIdx - 1];
                const prevStep = document.getElementById(`gstep-${prev}`);
                const prevStatus = document.getElementById(`pstatus-${prev}`);
                if (prevStep) { prevStep.classList.remove('active'); prevStep.classList.add('done'); }
                if (prevStatus) prevStatus.textContent = '✅ Done';
            }
            const step = document.getElementById(`gstep-${t}`);
            const status = document.getElementById(`pstatus-${t}`);
            if (step) step.classList.add('active');
            if (status) status.textContent = '🔄 Working...';
            label.textContent = `🧠 Generating ${t}...`;
            stepIdx++;
        }

        if (pct < 88) pct += Math.random() * 3 + 1;
        if (pct > 88) pct = 88;
        fill.style.width = `${pct}%`;
        pctEl.textContent = `${Math.round(pct)}%`;
    }, 3500);

    funEl.textContent = funMessages[0];
    msgInterval = setInterval(() => {
        msgIdx = (msgIdx + 1) % funMessages.length;
        funEl.textContent = funMessages[msgIdx];
    }, 2500);

    window._progressInterval = interval;
}

function stopProgress() {
    if (window._progressInterval) clearInterval(window._progressInterval);
    if (msgInterval) clearInterval(msgInterval);
}

function completeProgress() {
    const fill = document.getElementById('gen-progress-fill');
    const pctEl = document.getElementById('gen-percent');
    const label = document.getElementById('progress-label');
    const funEl = document.getElementById('fun-message');

    fill.style.width = '100%';
    pctEl.textContent = '100%';
    label.textContent = '🎉 All done!';
    funEl.textContent = '🎓 Your study kit is ready! Click the tabs below to explore.';

    ['quiz', 'flashcards', 'tricks', 'summary', 'compare'].forEach(t => {
        const step = document.getElementById(`gstep-${t}`);
        const status = document.getElementById(`pstatus-${t}`);
        if (step) { step.classList.remove('active'); step.classList.add('done'); }
        if (status) status.textContent = '✅ Done';
    });
}

// ============================================
// DISPLAY RESULTS
// ============================================
function displayResults(data, types) {
    document.getElementById('results-section').classList.remove('hidden');

    let qCount = 0, fcCount = 0, trCount = 0, cmpCount = 0;

    if (data.summary) buildSummary(data.summary);

    if (data.quizzes?.length) {
        buildQuiz(data.quizzes);
        qCount = data.quizzes.length;
    }

    if (data.flashcards?.length) {
        buildFlashcards(data.flashcards);
        fcCount = data.flashcards.length;
    }

    if (data.tricks?.length) {
        buildTricks(data.tricks);
        trCount = data.tricks.length;
    }

    if (data.compare) {
        buildCompare(data.compare);
        cmpCount = (data.compare.comparisons?.length || 0) +
                   (data.compare.key_concepts?.length || 0);
    }

    // Update all stats
    document.getElementById('stat-questions').textContent = qCount;
    document.getElementById('stat-flashcards').textContent = fcCount;
    document.getElementById('stat-tricks').textContent = trCount;
    document.getElementById('stat-compare').textContent = cmpCount;
    document.getElementById('stat-score').textContent = '—';
    document.getElementById('flashcard-count').textContent = `${fcCount} cards`;
    document.getElementById('score-badge').textContent = `0 / ${qCount}`;
    quizScore.total = qCount;

    // Switch to summary tab by default
    switchTab('summary');
    document.getElementById('results-section').scrollIntoView({ behavior: 'smooth' });
}

// ============================================
// TAB SWITCHING
// ============================================
function switchTab(name) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    const tab = document.getElementById(`tab-${name}`);
    const panel = document.getElementById(`panel-${name}`);
    if (tab) tab.classList.add('active');
    if (panel) panel.classList.add('active');
}

// ============================================
// BUILD SUMMARY
// ============================================
function buildSummary(summary) {
    document.getElementById('summary-content').innerHTML = `
        <p class="summary-text">${esc(summary.summary || 'No summary available.')}</p>
        ${summary.key_points?.length ? `
        <h4 style="margin-bottom:10px;font-size:0.9rem;color:var(--text2);
                   font-weight:700;letter-spacing:0.5px;">🔑 KEY POINTS</h4>
        <ul class="key-points">
            ${summary.key_points.map(p => `<li>${esc(p)}</li>`).join('')}
        </ul>` : ''}
    `;
}

// ============================================
// BUILD QUIZ
// ============================================
function buildQuiz(questions) {
    document.getElementById('quiz-container').innerHTML = questions.map((q, i) => `
        <div class="quiz-question" data-index="${i}">
            <h3>Q${i + 1}. ${esc(q.question)}</h3>
            <ul class="quiz-options">
                ${q.options.map(opt => `
                    <li data-ans="${esc(opt.charAt(0))}"
                        onclick="pickAnswer(${i}, '${esc(opt.charAt(0))}')">
                        ${esc(opt)}
                    </li>
                `).join('')}
            </ul>
            <div class="quiz-explanation hidden">
                <strong>✅ Correct Answer: ${esc(q.answer)}</strong>
                ${q.explanation ? `<br><br>${esc(q.explanation)}` : ''}
            </div>
        </div>
    `).join('');
}

function pickAnswer(idx, chosen) {
    const qEl = document.querySelector(`[data-index="${idx}"]`);
    const opts = qEl.querySelectorAll('.quiz-options li');
    const correct = currentResults.quizzes[idx].answer;

    opts.forEach(o => o.style.pointerEvents = 'none');
    opts.forEach(o => {
        if (o.dataset.ans === chosen && chosen !== correct) o.classList.add('incorrect');
        if (o.dataset.ans === correct) o.classList.add('correct');
    });

    if (chosen === correct) quizScore.correct++;
    qEl.querySelector('.quiz-explanation').classList.remove('hidden');

    const pct = quizScore.total
        ? Math.round((quizScore.correct / quizScore.total) * 100)
        : 0;
    document.getElementById('score-badge').textContent =
        `${quizScore.correct} / ${quizScore.total}`;
    document.getElementById('stat-score').textContent = `${pct}%`;
}

function toggleAnswers() {
    const exps = document.querySelectorAll('.quiz-explanation');
    const hidden = exps[0]?.classList.contains('hidden');
    exps.forEach(e => e.classList.toggle('hidden', !hidden));
    document.getElementById('show-answers-btn').textContent =
        hidden ? 'Hide Answers' : 'Show Answers';
}

// ============================================
// BUILD FLASHCARDS
// ============================================
function buildFlashcards(cards) {
    document.getElementById('flashcards-container').innerHTML = `
        <div class="flashcards-grid">
            ${cards.map(c => `
                <div class="flashcard" onclick="this.classList.toggle('flipped')">
                    <div class="flashcard-inner">
                        <div class="flashcard-front">
                            <span class="flashcard-label">Question</span>
                            <p class="flashcard-text">${esc(c.question)}</p>
                            <span class="flashcard-hint">👆 Tap to flip</span>
                        </div>
                        <div class="flashcard-back">
                            <span class="flashcard-label">Answer</span>
                            <p class="flashcard-text">${esc(c.answer)}</p>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// ============================================
// BUILD TRICKS
// ============================================
function buildTricks(tricks) {
    const icons = {
        mnemonic: '🧠',
        analogy: '🔗',
        simplification: '✂️',
        real_world_example: '🌍'
    };
    document.getElementById('tricks-container').innerHTML = tricks.map(t => `
        <div class="trick-item ${t.type || ''}">
            <div class="trick-emoji">${icons[t.type] || '💡'}</div>
            <div class="trick-body">
                <div class="trick-type-badge">${(t.type || 'tip').replace(/_/g, ' ')}</div>
                <div class="trick-title">${esc(t.title)}</div>
                <div class="trick-content">${esc(t.content)}</div>
            </div>
        </div>
    `).join('');
}

// ============================================
// BUILD COMPARE
// ============================================
function buildCompare(compare) {
    const container = document.getElementById('compare-container');

    if (!compare ||
        (!compare.comparisons?.length && !compare.key_concepts?.length)) {
        container.innerHTML = `
            <div class="empty-compare">
                ⚖️ No comparisons found in this document.<br>
                Try uploading a document with multiple topics or technologies.
            </div>`;
        return;
    }

    let html = '';

    // Full A vs B Comparisons
    if (compare.comparisons?.length) {
        compare.comparisons.forEach(comp => {
            html += `<div class="compare-section">
                <div class="compare-title">⚖️ ${esc(comp.title)}</div>`;

            // Similarities
            if (comp.similarities?.length) {
                html += `
                <div style="margin-bottom:16px;">
                    <div style="font-size:0.78rem;font-weight:700;color:var(--primary);
                                letter-spacing:1px;margin-bottom:8px;">🔵 SIMILARITIES</div>
                    <div class="similarities-list">
                        ${comp.similarities.map(s => `
                            <div class="similarity-item">
                                <div class="similarity-dot"></div>
                                <span>${esc(s)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>`;
            }

            // Differences Table
            if (comp.differences?.length) {
                html += `
                <div style="margin-bottom:16px;">
                    <div style="font-size:0.78rem;font-weight:700;color:var(--danger);
                                letter-spacing:1px;margin-bottom:8px;">🔴 DIFFERENCES</div>
                    <table class="diff-table">
                        <thead>
                            <tr>
                                <th>Aspect</th>
                                <th>${esc(comp.topic_a)}</th>
                                <th>${esc(comp.topic_b)}</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${comp.differences.map(d => `
                                <tr>
                                    <td>${esc(d.aspect)}</td>
                                    <td>${esc(d.topic_a)}</td>
                                    <td>${esc(d.topic_b)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>`;
            }

            // Advantages & Disadvantages
            if (comp.advantages_a?.length || comp.advantages_b?.length) {
                html += `
                <div style="font-size:0.78rem;font-weight:700;color:var(--text2);
                            letter-spacing:1px;margin-bottom:10px;">
                    ✅ ADVANTAGES & ❌ DISADVANTAGES
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">
                    <div>
                        <div style="font-weight:700;font-size:0.88rem;
                                    color:var(--primary);margin-bottom:10px;">
                            ${esc(comp.topic_a)}
                        </div>
                        <div class="pros-box" style="margin-bottom:8px;">
                            <div class="pros-cons-header">✅ Advantages</div>
                            <ul class="pros-cons-list">
                                ${(comp.advantages_a || []).map(a =>
                                    `<li>${esc(a)}</li>`).join('')}
                            </ul>
                        </div>
                        <div class="cons-box">
                            <div class="pros-cons-header">❌ Disadvantages</div>
                            <ul class="pros-cons-list">
                                ${(comp.disadvantages_a || []).map(a =>
                                    `<li>${esc(a)}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                    <div>
                        <div style="font-weight:700;font-size:0.88rem;
                                    color:var(--success);margin-bottom:10px;">
                            ${esc(comp.topic_b)}
                        </div>
                        <div class="pros-box" style="margin-bottom:8px;">
                            <div class="pros-cons-header">✅ Advantages</div>
                            <ul class="pros-cons-list">
                                ${(comp.advantages_b || []).map(a =>
                                    `<li>${esc(a)}</li>`).join('')}
                            </ul>
                        </div>
                        <div class="cons-box">
                            <div class="pros-cons-header">❌ Disadvantages</div>
                            <ul class="pros-cons-list">
                                ${(comp.disadvantages_b || []).map(a =>
                                    `<li>${esc(a)}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                </div>`;
            }

            html += `</div>`;
        });
    }

    // Key Concepts Pros/Cons
    if (compare.key_concepts?.length) {
        html += `
        <div class="compare-section">
            <div class="compare-title">📌 Key Concept Analysis</div>
            ${compare.key_concepts.map(c => `
                <div class="concept-card">
                    <div class="concept-name">📌 ${esc(c.concept)}</div>
                    <div class="pros-cons-grid">
                        <div class="pros-box">
                            <div class="pros-cons-header">✅ Advantages</div>
                            <ul class="pros-cons-list">
                                ${(c.advantages || []).map(a =>
                                    `<li>${esc(a)}</li>`).join('')}
                            </ul>
                        </div>
                        <div class="cons-box">
                            <div class="pros-cons-header">❌ Disadvantages</div>
                            <ul class="pros-cons-list">
                                ${(c.disadvantages || []).map(d =>
                                    `<li>${esc(d)}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>`;
    }

    container.innerHTML = html;
}

// ============================================
// COPY
// ============================================
function copySection(id) {
    const text = document.getElementById(id)?.innerText || '';
    navigator.clipboard.writeText(text).then(() => {
        const btn = document.querySelector(`[onclick="copySection('${id}')"]`);
        if (btn) {
            btn.textContent = '✅ Copied!';
            setTimeout(() => btn.textContent = '📋', 2000);
        }
    });
}

// ============================================
// ERROR
// ============================================
function showError(msg) {
    document.getElementById('error-message').textContent = msg;
    document.getElementById('error-display').classList.remove('hidden');
}

function hideError() {
    document.getElementById('error-display').classList.add('hidden');
}

// ============================================
// UTILITY
// ============================================
function esc(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}