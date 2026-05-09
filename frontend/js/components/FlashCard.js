/* ============================================
   FLASHCARD COMPONENT
   3D flip cards with swipe support
   ============================================ */

   const FlashCard = {
    currentIndex: 0,
    cards: [],
    isFlipped: false,

    // Render flashcards
    render(flashcardData) {
        const container = DOM.get('flashcard-content');
        const countEl = DOM.get('flashcard-count');

        if (!container) return;

        // Handle different data formats
        let cards = [];
        if (Array.isArray(flashcardData)) {
            cards = flashcardData;
        } else if (flashcardData.flashcards) {
            cards = flashcardData.flashcards;
        } else if (flashcardData.cards) {
            cards = flashcardData.cards;
        }

        this.cards = cards;
        this.currentIndex = 0;

        if (cards.length === 0) {
            container.innerHTML = this.renderEmpty();
            return;
        }

        // Update count
        if (countEl) {
            countEl.textContent = `${cards.length} card${cards.length !== 1 ? 's' : ''}`;
        }

        // Render flashcard viewer
        container.innerHTML = this.renderViewer(cards);

        // Bind events
        this.bindEvents();
    },

    // Render card viewer with navigation
    renderViewer(cards) {
        return `
            <div class="flashcard-viewer">
                <!-- Card Display -->
                <div class="flashcard-stage" id="flashcard-stage">
                    ${this.renderCard(cards[0], 0)}
                </div>

                <!-- Navigation -->
                <div class="flashcard-nav">
                    <button class="fc-nav-btn" id="fc-prev" onclick="FlashCard.prevCard()">
                        ← Previous
                    </button>
                    <div class="fc-counter">
                        <span id="fc-current">1</span> / <span id="fc-total">${cards.length}</span>
                    </div>
                    <button class="fc-nav-btn" id="fc-next" onclick="FlashCard.nextCard()">
                        Next →
                    </button>
                </div>

                <!-- Card dots -->
                <div class="fc-dots" id="fc-dots">
                    ${cards.map((_, i) => `
                        <div class="fc-dot ${i === 0 ? 'active' : ''}" 
                             onclick="FlashCard.goToCard(${i})">
                        </div>
                    `).join('')}
                </div>

                <!-- Hint -->
                <p class="fc-hint">Click card to flip • Use arrows to navigate</p>
            </div>
        `;
    },

    // Render single card
    renderCard(card, index) {
        const front = card.front || card.question || card.term || `Card ${index + 1}`;
        const back = card.back || card.answer || card.definition || 'No answer available';

        return `
            <div class="fc-card" id="fc-card-${index}" onclick="FlashCard.flipCard()">
                <div class="fc-card-inner" id="fc-card-inner">
                    <div class="fc-card-front">
                        <div class="fc-card-label">Question</div>
                        <div class="fc-card-content">${this.escapeHtml(front)}</div>
                        <div class="fc-flip-hint">Tap to reveal answer</div>
                    </div>
                    <div class="fc-card-back">
                        <div class="fc-card-label">Answer</div>
                        <div class="fc-card-content">${this.escapeHtml(back)}</div>
                        <div class="fc-flip-hint">Tap to see question</div>
                    </div>
                </div>
            </div>
        `;
    },

    // Flip current card
    flipCard() {
        const inner = DOM.get('fc-card-inner');
        if (!inner) return;

        this.isFlipped = !this.isFlipped;
        inner.style.transform = this.isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)';
    },

    // Go to next card
    nextCard() {
        if (this.currentIndex < this.cards.length - 1) {
            this.goToCard(this.currentIndex + 1);
        }
    },

    // Go to previous card
    prevCard() {
        if (this.currentIndex > 0) {
            this.goToCard(this.currentIndex - 1);
        }
    },

    // Go to specific card
    goToCard(index) {
        if (index < 0 || index >= this.cards.length) return;

        // Reset flip state
        this.isFlipped = false;

        // Update current index
        this.currentIndex = index;

        // Update card display
        const stage = DOM.get('flashcard-stage');
        if (stage) {
            stage.style.opacity = '0';
            stage.style.transform = 'scale(0.95)';

            setTimeout(() => {
                stage.innerHTML = this.renderCard(this.cards[index], index);
                stage.style.opacity = '1';
                stage.style.transform = 'scale(1)';
            }, 200);
        }

        // Update counter
        const currentEl = DOM.get('fc-current');
        if (currentEl) currentEl.textContent = index + 1;

        // Update dots
        document.querySelectorAll('.fc-dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });

        // Update nav buttons
        const prevBtn = DOM.get('fc-prev');
        const nextBtn = DOM.get('fc-next');

        if (prevBtn) {
            prevBtn.style.opacity = index === 0 ? '0.4' : '1';
            prevBtn.style.pointerEvents = index === 0 ? 'none' : 'all';
        }

        if (nextBtn) {
            nextBtn.style.opacity = index === this.cards.length - 1 ? '0.4' : '1';
            nextBtn.style.pointerEvents = index === this.cards.length - 1 ? 'none' : 'all';
        }
    },

    // Bind keyboard and swipe events
    bindEvents() {
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            const stage = DOM.get('flashcard-stage');
            if (!stage) return;

            if (e.key === 'ArrowRight') this.nextCard();
            if (e.key === 'ArrowLeft') this.prevCard();
            if (e.key === ' ') {
                e.preventDefault();
                this.flipCard();
            }
        });

        // Touch/swipe support
        let touchStartX = 0;
        let touchEndX = 0;

        const stage = DOM.get('flashcard-stage');
        if (!stage) return;

        stage.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        });

        stage.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            const diff = touchStartX - touchEndX;

            if (Math.abs(diff) > 50) {
                if (diff > 0) {
                    this.nextCard();
                } else {
                    this.prevCard();
                }
            }
        });
    },

    // Render empty state
    renderEmpty() {
        return `
            <div class="empty-state">
                <div class="empty-icon">🃏</div>
                <p class="empty-text">No flashcards generated yet.</p>
            </div>
        `;
    },

    // Escape HTML
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

// Add flashcard styles
const flashcardStyles = document.createElement('style');
flashcardStyles.textContent = `
    .flashcard-viewer {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 24px;
    }
    .flashcard-stage {
        width: 100%;
        max-width: 500px;
        min-height: 250px;
        transition: all 0.3s ease;
    }
    .fc-card {
        width: 100%;
        min-height: 250px;
        cursor: pointer;
        perspective: 1000px;
    }
    .fc-card-inner {
        position: relative;
        width: 100%;
        min-height: 250px;
        transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        transform-style: preserve-3d;
    }
    .fc-card-front,
    .fc-card-back {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        min-height: 250px;
        padding: 32px;
        border-radius: 20px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center;
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
    }
    .fc-card-front {
        background: var(--glass-bg);
        border: 1px solid var(--glass-border);
        box-shadow: 0 0 30px rgba(0, 240, 255, 0.1);
    }
    .fc-card-back {
        background: linear-gradient(135deg, rgba(0,240,255,0.1), rgba(131,56,236,0.1));
        border: 1px solid rgba(0, 240, 255, 0.3);
        box-shadow: 0 0 30px rgba(0, 240, 255, 0.2);
        transform: rotateY(180deg);
    }
    .fc-card-label {
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 2px;
        color: var(--primary);
        margin-bottom: 16px;
    }
    .fc-card-content {
        font-size: 20px;
        font-weight: 600;
        line-height: 1.5;
        color: var(--text-primary);
    }
    .fc-flip-hint {
        margin-top: 16px;
        font-size: 12px;
        color: var(--text-muted);
    }
    .flashcard-nav {
        display: flex;
        align-items: center;
        gap: 24px;
    }
    .fc-nav-btn {
        padding: 10px 20px;
        background: var(--bg-surface);
        border: 1px solid var(--glass-border);
        border-radius: 10px;
        color: var(--text-primary);
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        font-family: inherit;
    }
    .fc-nav-btn:hover {
        border-color: var(--primary);
        box-shadow: var(--glow-primary);
    }
    .fc-counter {
        font-size: 16px;
        font-weight: 600;
        color: var(--text-secondary);
        min-width: 60px;
        text-align: center;
    }
    .fc-dots {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        justify-content: center;
        max-width: 300px;
    }
    .fc-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--glass-border);
        cursor: pointer;
        transition: all 0.2s ease;
    }
    .fc-dot.active {
        background: var(--primary);
        box-shadow: var(--glow-primary);
        transform: scale(1.3);
    }
    .fc-hint {
        font-size: 13px;
        color: var(--text-muted);
    }
`;
document.head.appendChild(flashcardStyles);

// Make globally available
window.FlashCard = FlashCard;