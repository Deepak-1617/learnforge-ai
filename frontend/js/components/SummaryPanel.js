/* ============================================
   SUMMARY PANEL COMPONENT
   Renders AI-generated document summary
   with typewriter effect and key points
   ============================================ */

   const SummaryPanel = {
    // Render summary
    render(summaryData) {
        const container = DOM.get('summary-content');
        const wordCountEl = DOM.get('summary-word-count');

        if (!container) return;

        // Handle different data formats
        let summary = '';
        let keyPoints = [];
        let wordCount = 0;

        if (typeof summaryData === 'string') {
            summary = summaryData;
        } else {
            summary = summaryData.summary || summaryData.text || '';
            keyPoints = summaryData.key_points || summaryData.points || summaryData.highlights || [];
            wordCount = summaryData.word_count || summary.split(' ').length;
        }

        // Update word count
        if (wordCountEl) {
            wordCountEl.textContent = `${wordCount || summary.split(' ').length} words`;
        }

        if (!summary && keyPoints.length === 0) {
            container.innerHTML = this.renderEmpty();
            return;
        }

        // Render summary HTML first
        container.innerHTML = this.renderSummaryHTML(summary, keyPoints);

        // Then apply typewriter effect
        if (summary) {
            const summaryEl = DOM.get('summary-text-content');
            if (summaryEl) {
                summaryEl.textContent = '';
                LoadingEffects.typewriter(summaryEl, summary, 15);
            }
        }

        // Animate key points
        this.animateKeyPoints();
    },

    // Render summary HTML structure
    renderSummaryHTML(summary, keyPoints) {
        return `
            ${summary ? `
                <div class="summary-text-wrapper">
                    <div class="summary-ai-label">
                        <span class="ai-dot"></span>
                        AI Generated Summary
                    </div>
                    <div class="summary-text" id="summary-text-content">
                        ${this.escapeHtml(summary)}
                    </div>
                </div>
            ` : ''}

            ${keyPoints.length > 0 ? `
                <div class="key-points-section">
                    <h4 class="key-points-title">
                        <span>🎯</span>
                        Key Takeaways
                    </h4>
                    <div class="summary-points" id="summary-points">
                        ${keyPoints.map((point, index) =>
                            this.renderKeyPoint(point, index)
                        ).join('')}
                    </div>
                </div>
            ` : ''}
        `;
    },

    // Render single key point
    renderKeyPoint(point, index) {
        const text = typeof point === 'string' ? point : (point.text || point.point || String(point));

        return `
            <div class="summary-point" 
                 style="opacity: 0; animation: fadeInUp 0.5s ease-out ${index * 0.1 + 1}s forwards">
                <div class="summary-point-icon">${index + 1}</div>
                <p class="summary-point-text">${this.escapeHtml(text)}</p>
            </div>
        `;
    },

    // Animate key points appearing
    animateKeyPoints() {
        const points = document.querySelectorAll('.summary-point');
        points.forEach((point, index) => {
            setTimeout(() => {
                point.style.opacity = '1';
                point.style.transform = 'translateY(0)';
            }, (index + 1) * 200 + 500);
        });
    },

    // Render empty state
    renderEmpty() {
        return `
            <div class="empty-state">
                <div class="empty-icon">📝</div>
                <p class="empty-text">No summary generated yet.</p>
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

// Add summary-specific styles
const summaryStyles = document.createElement('style');
summaryStyles.textContent = `
    .summary-text-wrapper {
        position: relative;
        margin-bottom: 32px;
    }
    .summary-ai-label {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 2px;
        color: var(--primary);
        margin-bottom: 16px;
    }
    .ai-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--primary);
        box-shadow: var(--glow-primary);
        animation: pulse-dot 2s infinite;
    }
    .summary-text {
        font-size: 16px;
        line-height: 1.9;
        color: var(--text-secondary);
        padding: 24px;
        background: var(--bg-surface);
        border: 1px solid var(--glass-border);
        border-radius: 16px;
        min-height: 80px;
        position: relative;
    }
    .summary-text::after {
        content: '|';
        color: var(--primary);
        animation: blink 1s step-end infinite;
    }
    @keyframes blink {
        from, to { opacity: 1; }
        50% { opacity: 0; }
    }
    .key-points-title {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 18px;
        font-weight: 700;
        margin-bottom: 16px;
        color: var(--text-primary);
    }
    .summary-point {
        transform: translateY(20px);
        transition: all 0.5s ease;
    }
`;
document.head.appendChild(summaryStyles);

// Make globally available
window.SummaryPanel = SummaryPanel;