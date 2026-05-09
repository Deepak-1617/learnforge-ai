/* ============================================
   QUIZ CARD COMPONENT
   Renders interactive quiz questions
   with flip animations and score tracking
   ============================================ */

   const QuizCard = {
    score: 0,
    totalAnswered: 0,
    totalQuestions: 0,

    // Render quiz results
    render(quizData) {
        const container = DOM.get('quiz-content');
        const countEl = DOM.get('quiz-count');

        if (!container) return;

        // Reset score
        this.score = 0;
        this.totalAnswered = 0;

        // Handle different data formats
        let questions = [];
        if (Array.isArray(quizData)) {
            questions = quizData;
        } else if (quizData.questions) {
            questions = quizData.questions;
        } else if (quizData.quiz) {
            questions = quizData.quiz;
        }

        this.totalQuestions = questions.length;

        if (questions.length === 0) {
            container.innerHTML = this.renderEmpty();
            return;
        }

        // Update count
        if (countEl) {
            countEl.textContent = `${questions.length} question${questions.length !== 1 ? 's' : ''}`;
        }

        // Render questions
        container.innerHTML = questions.map((q, index) =>
            this.renderQuestion(q, index)
        ).join('');

        // Add score tracker
        container.insertAdjacentHTML('beforeend', this.renderScoreTracker());

        // Bind option clicks
        this.bindOptionEvents();
    },

    // Render single question
    renderQuestion(question, index) {
        const questionText = question.question || question.q || `Question ${index + 1}`;
        const options = question.options || question.choices || [];
        const answer = question.answer || question.correct_answer || question.correct || '';
        const explanation = question.explanation || '';

        return `
            <div class="quiz-item" data-question="${index}" data-answer="${this.escapeHtml(answer)}">
                <div class="quiz-item-header">
                    <span class="quiz-number">Q${index + 1}</span>
                    <div class="quiz-status" id="quiz-status-${index}"></div>
                </div>
                <p class="quiz-question">${this.escapeHtml(questionText)}</p>
                <div class="quiz-options" id="quiz-options-${index}">
                    ${options.map((option, optIndex) => `
                        <div class="quiz-option" 
                             data-option="${this.escapeHtml(option)}" 
                             data-question="${index}"
                             data-index="${optIndex}">
                            <span class="option-label">${String.fromCharCode(65 + optIndex)}</span>
                            <span class="option-text">${this.escapeHtml(option)}</span>
                        </div>
                    `).join('')}
                </div>
                ${explanation ? `
                    <div class="quiz-answer hidden" id="quiz-answer-${index}">
                        <span class="answer-label">💡 Explanation:</span>
                        <span class="answer-text">${this.escapeHtml(explanation)}</span>
                    </div>
                ` : ''}
            </div>
        `;
    },

    // Render score tracker
    renderScoreTracker() {
        return `
            <div class="quiz-score-tracker" id="quiz-score-tracker">
                <div class="score-display">
                    <span class="score-label">Score</span>
                    <span class="score-value" id="score-value">0/${this.totalQuestions}</span>
                </div>
                <div class="score-bar-container">
                    <div class="score-bar" id="score-bar" style="width: 0%"></div>
                </div>
            </div>
        `;
    },

    // Render empty state
    renderEmpty() {
        return `
            <div class="empty-state">
                <div class="empty-icon">🧠</div>
                <p class="empty-text">No quiz questions generated yet.</p>
            </div>
        `;
    },

    // Bind option click events
    bindOptionEvents() {
        document.querySelectorAll('.quiz-option').forEach(option => {
            option.addEventListener('click', (e) => {
                this.handleOptionClick(e.currentTarget);
            });
        });
    },

    // Handle option selection
    handleOptionClick(optionEl) {
        const questionIndex = optionEl.dataset.question;
        const questionEl = document.querySelector(`[data-question="${questionIndex}"].quiz-item`);
        
        if (!questionEl) return;

        // Check if already answered
        if (questionEl.classList.contains('answered')) return;

        const selectedOption = optionEl.dataset.option;
        const correctAnswer = questionEl.dataset.answer;
        const optionsContainer = DOM.get(`quiz-options-${questionIndex}`);
        const answerEl = DOM.get(`quiz-answer-${questionIndex}`);
        const statusEl = DOM.get(`quiz-status-${questionIndex}`);

        // Mark question as answered
        questionEl.classList.add('answered');

        // Check if correct
        const isCorrect = this.checkAnswer(selectedOption, correctAnswer);

        // Update all options
        optionsContainer?.querySelectorAll('.quiz-option').forEach(opt => {
            opt.style.pointerEvents = 'none';
            
            if (opt.dataset.option === correctAnswer || 
                this.checkAnswer(opt.dataset.option, correctAnswer)) {
                opt.classList.add('correct');
                opt.style.borderColor = 'var(--success)';
                opt.style.background = 'rgba(6, 255, 165, 0.1)';
            }
        });

        // Mark selected option
        if (!isCorrect) {
            optionEl.classList.add('wrong');
            optionEl.style.borderColor = 'var(--secondary)';
            optionEl.style.background = 'rgba(255, 0, 110, 0.1)';
        }

        // Show explanation
        if (answerEl) DOM.show(answerEl);

        // Update status icon
        if (statusEl) {
            statusEl.innerHTML = isCorrect
                ? '<span style="color: var(--success); font-size: 20px;">✓</span>'
                : '<span style="color: var(--secondary); font-size: 20px;">✗</span>';
        }

        // Update score
        this.totalAnswered++;
        if (isCorrect) {
            this.score++;
            this.showScoreAnimation(optionEl);
        }

        this.updateScoreDisplay();

        // Ripple effect
        const rect = optionEl.getBoundingClientRect();
        Helpers.createParticleBurst(
            rect.left + rect.width / 2,
            rect.top + rect.height / 2,
            isCorrect ? 15 : 5
        );
    },

    // Check if answer is correct
    checkAnswer(selected, correct) {
        if (!selected || !correct) return false;
        const normalizeStr = str => str.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
        return normalizeStr(selected) === normalizeStr(correct) ||
               normalizeStr(correct).includes(normalizeStr(selected)) ||
               normalizeStr(selected).includes(normalizeStr(correct));
    },

    // Show score animation
    showScoreAnimation(element) {
        const scorePopup = document.createElement('div');
        scorePopup.textContent = '+1';
        scorePopup.style.cssText = `
            position: fixed;
            color: var(--success);
            font-size: 24px;
            font-weight: 700;
            pointer-events: none;
            z-index: 9999;
            animation: floatUp 1s ease-out forwards;
        `;

        const style = document.createElement('style');
        style.textContent = `
            @keyframes floatUp {
                0% { opacity: 1; transform: translateY(0); }
                100% { opacity: 0; transform: translateY(-50px); }
            }
        `;
        document.head.appendChild(style);

        const rect = element.getBoundingClientRect();
        scorePopup.style.left = (rect.left + rect.width / 2) + 'px';
        scorePopup.style.top = rect.top + 'px';

        document.body.appendChild(scorePopup);
        setTimeout(() => scorePopup.remove(), 1000);
    },

    // Update score display
    updateScoreDisplay() {
        const scoreValue = DOM.get('score-value');
        const scoreBar = DOM.get('score-bar');

        if (scoreValue) {
            scoreValue.textContent = `${this.score}/${this.totalQuestions}`;
        }

        if (scoreBar) {
            const percentage = (this.score / this.totalQuestions) * 100;
            scoreBar.style.width = percentage + '%';
            scoreBar.style.background = percentage >= 70
                ? 'var(--success)'
                : percentage >= 40
                    ? 'var(--warning)'
                    : 'var(--secondary)';
        }

        // Show completion animation if all answered
        if (this.totalAnswered === this.totalQuestions) {
            setTimeout(() => {
                LoadingEffects.createConfetti();
                FileUpload.showSuccess(`Quiz complete! Score: ${this.score}/${this.totalQuestions}`);
            }, 500);
        }
    },

    // Escape HTML to prevent XSS
    escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
};

// Add quiz-specific styles dynamically
const quizStyles = document.createElement('style');
quizStyles.textContent = `
    .quiz-item-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
    }
    .quiz-number {
        font-size: 12px;
        font-weight: 700;
        color: var(--primary);
        background: rgba(0, 240, 255, 0.1);
        border: 1px solid rgba(0, 240, 255, 0.3);
        padding: 4px 10px;
        border-radius: 20px;
        font-family: 'JetBrains Mono', monospace;
    }
    .quiz-option {
        display: flex;
        align-items: center;
        gap: 12px;
    }
    .option-label {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: rgba(255,255,255,0.05);
        border: 1px solid var(--glass-border);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 700;
        flex-shrink: 0;
    }
    .answer-label {
        font-weight: 700;
        color: var(--success);
        display: block;
        margin-bottom: 6px;
    }
    .quiz-score-tracker {
        margin-top: 24px;
        padding: 20px;
        background: var(--bg-surface);
        border: 1px solid var(--glass-border);
        border-radius: 12px;
    }
    .score-display {
        display: flex;
        justify-content: space-between;
        margin-bottom: 12px;
        font-weight: 600;
    }
    .score-bar-container {
        height: 6px;
        background: rgba(255,255,255,0.1);
        border-radius: 10px;
        overflow: hidden;
    }
    .score-bar {
        height: 100%;
        border-radius: 10px;
        background: var(--gradient-primary);
        transition: width 0.5s ease-out;
        box-shadow: var(--glow-primary);
    }
    .empty-state {
        text-align: center;
        padding: 40px;
        opacity: 0.5;
    }
    .empty-icon { font-size: 48px; margin-bottom: 16px; }
    .empty-text { font-size: 16px; color: var(--text-muted); }
`;
document.head.appendChild(quizStyles);

// Make globally available
window.QuizCard = QuizCard;