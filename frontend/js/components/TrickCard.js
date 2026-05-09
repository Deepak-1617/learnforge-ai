/* ============================================
   TRICK CARD COMPONENT
   Renders memory tricks and learning hacks
   ============================================ */

   const TrickCard = {
    // Render tricks
    render(tricksData) {
        const container = DOM.get('tricks-content');
        const countEl = DOM.get('tricks-count');

        if (!container) return;

        // Handle different data formats
        let tricks = [];
        if (Array.isArray(tricksData)) {
            tricks = tricksData;
        } else if (tricksData.tricks) {
            tricks = tricksData.tricks;
        } else if (tricksData.memory_tricks) {
            tricks = tricksData.memory_tricks;
        }

        if (tricks.length === 0) {
            container.innerHTML = this.renderEmpty();
            return;
        }

        // Update count
        if (countEl) {
            countEl.textContent = `${tricks.length} trick${tricks.length !== 1 ? 's' : ''}`;
        }

        // Render tricks with stagger animation
        container.innerHTML = tricks.map((trick, index) =>
            this.renderTrick(trick, index)
        ).join('');

        // Animate in
        this.animateTricks();
    },

    // Render single trick
    renderTrick(trick, index) {
        const concept = trick.concept || trick.topic || trick.title || `Trick ${index + 1}`;
        const method = trick.trick || trick.method || trick.mnemonic || trick.description || '';
        const example = trick.example || '';
        const type = trick.type || 'general';

        const icon = this.getTrickIcon(type);
        const color = this.getTrickColor(index);

        return `
            <div class="trick-item" 
                 style="--trick-color: ${color}; animation-delay: ${index * 0.1}s"
                 data-aos="fade-up"
                 data-aos-delay="${index * 100}">
                <div class="trick-header">
                    <div class="trick-icon-wrap" style="background: ${color}20; border-color: ${color}40;">
                        <span class="trick-icon">${icon}</span>
                    </div>
                    <div class="trick-header-text">
                        <h4 class="trick-concept">${this.escapeHtml(concept)}</h4>
                        <span class="trick-type-badge">${this.formatType(type)}</span>
                    </div>
                </div>
                <div class="trick-body">
                    <p class="trick-method">${this.escapeHtml(method)}</p>
                    ${example ? `
                        <div class="trick-example">
                            <span class="example-label">📌 Example:</span>
                            <span class="example-text">${this.escapeHtml(example)}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    },

    // Get icon based on trick type
    getTrickIcon(type) {
        const icons = {
            acronym: '🔤',
            visualization: '👁️',
            story: '📖',
            rhyme: '🎵',
            chunking: '🧩',
            association: '🔗',
            mnemonic: '🧠',
            general: '💡',
            pattern: '🔮',
            technique: '⚡'
        };
        return icons[type?.toLowerCase()] || '💡';
    },

    // Get color based on index
    getTrickColor(index) {
        const colors = [
            '#00f0ff',
            '#ff006e',
            '#8338ec',
            '#06ffa5',
            '#ffbe0b',
            '#f093fb'
        ];
        return colors[index % colors.length];
    },

    // Format trick type
    formatType(type) {
        if (!type) return 'Memory Trick';
        return type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ');
    },

    // Animate tricks on load
    animateTricks() {
        const tricks = document.querySelectorAll('.trick-item');
        tricks.forEach((trick, index) => {
            trick.style.opacity = '0';
            trick.style.transform = 'translateX(-20px)';

            setTimeout(() => {
                trick.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
                trick.style.opacity = '1';
                trick.style.transform = 'translateX(0)';
            }, index * 100);
        });
    },

    // Render empty state
    renderEmpty() {
        return `
            <div class="empty-state">
                <div class="empty-icon">💡</div>
                <p class="empty-text">No memory tricks generated yet.</p>
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

// Add trick-specific styles
const trickStyles = document.createElement('style');
trickStyles.textContent = `
    .trick-item {
        border-left: 3px solid var(--trick-color, var(--primary)) !important;
    }
    .trick-item:hover {
        border-left-color: var(--trick-color, var(--primary)) !important;
        box-shadow: -4px 0 20px rgba(0, 240, 255, 0.2) !important;
    }
    .trick-header {
        display: flex;
        align-items: flex-start;
        gap: 16px;
        margin-bottom: 16px;
    }
    .trick-icon-wrap {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid;
        flex-shrink: 0;
    }
    .trick-icon {
        font-size: 24px;
    }
    .trick-header-text {
        flex: 1;
    }
    .trick-type-badge {
        display: inline-block;
        padding: 2px 10px;
        background: rgba(0, 240, 255, 0.1);
        border: 1px solid rgba(0, 240, 255, 0.2);
        border-radius: 20px;
        font-size: 11px;
        font-weight: 600;
        color: var(--primary);
        margin-top: 4px;
    }
    .trick-body {
        padding-left: 64px;
    }
    .trick-example {
        margin-top: 12px;
        padding: 12px 16px;
        background: rgba(255, 255, 255, 0.03);
        border-radius: 8px;
        font-size: 13px;
    }
    .example-label {
        font-weight: 600;
        color: var(--warning);
        display: block;
        margin-bottom: 4px;
    }
    .example-text {
        color: var(--text-secondary);
        line-height: 1.5;
    }
    @media (max-width: 480px) {
        .trick-body {
            padding-left: 0;
        }
    }
`;
document.head.appendChild(trickStyles);

// Make globally available
window.TrickCard = TrickCard;