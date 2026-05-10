/* ============================================
   MAIN APPLICATION ORCHESTRATOR
   Initializes all systems and coordinates
   the entire frontend experience
   ============================================ */

   const App = {
    // App version
    version: '2.0.0',
    
    // Initialization
    async init() {
        console.log(`🚀 LearnForge AI v${this.version} - Neural System Initializing...`);

        try {
            // Initialize effects first (visual priority)
            this.initEffects();

            // Initialize UI components
            this.initComponents();

            // Check AI backend status
            await this.checkBackendStatus();

            // Setup global event listeners
            this.setupGlobalEvents();

            console.log('✅ LearnForge AI fully initialized');
        } catch (error) {
            console.error('❌ App initialization failed:', error);
        }
    },

    // Initialize all visual effects
    initEffects() {
        // 3D Background (Three.js)
        if (typeof initBackground === 'function') {
            initBackground();
        }

        // Particle system
        if (typeof initParticles === 'function') {
            initParticles();
        }

        // Interactive effects
        if (typeof Interactions !== 'undefined') {
            Interactions.init();
        }
    },

    // Initialize UI components
    initComponents() {
        // File upload component
        FileUpload.init();
    },

    // Check backend AI status
    async checkBackendStatus() {
        const statusEl = DOM.get('ai-status');
        const statusTextEl = DOM.get('status-text');

        // Show checking state
        if (statusTextEl) statusTextEl.textContent = 'Connecting to Neural Engine...';

        try {
            const result = await API.checkAIStatus();

            if (result.success && result.available) {
                // Update state
                AppState.setAIStatus({
                    available: true,
                    provider: result.provider,
                    model: result.model
                });

                // Update UI
                if (statusTextEl) {
                    statusTextEl.textContent = `✓ ${result.provider?.toUpperCase()} (${result.model}) Ready`;
                }

                if (statusEl) {
                    const dot = statusEl.querySelector('.status-dot');
                    if (dot) {
                        dot.style.background = 'var(--success)';
                        dot.style.boxShadow = 'var(--glow-success)';
                    }
                }

            } else {
                // AI not available
                AppState.setAIStatus({ available: false });

                if (statusTextEl) {
                    statusTextEl.textContent = '⚠ AI Offline - Check Backend';
                }

                if (statusEl) {
                    const dot = statusEl.querySelector('.status-dot');
                    if (dot) {
                        dot.style.background = 'var(--secondary)';
                        dot.style.boxShadow = 'var(--glow-secondary)';
                        dot.style.animation = 'none';
                    }
                }
            }
        } catch (error) {
            console.error('Backend status check failed:', error);

            if (statusTextEl) {
                statusTextEl.textContent = '⚠ Cannot connect to backend';
            }
        }
    },

    // Setup global event listeners
    setupGlobalEvents() {
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl+U = Upload
            if (e.ctrlKey && e.key === 'u') {
                e.preventDefault();
                DOM.get('file-input')?.click();
            }
        });

        // Page visibility change (pause animations when tab is hidden)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                document.querySelectorAll('.orb').forEach(orb => {
                    orb.style.animationPlayState = 'paused';
                });
            } else {
                document.querySelectorAll('.orb').forEach(orb => {
                    orb.style.animationPlayState = 'running';
                });
            }
        });

        // Window resize handler
        window.addEventListener('resize', Helpers.debounce(() => {
            this.handleResize();
        }, 300));

        // State listeners
        AppState.on('fileChanged', (fileData) => {
            console.log('📄 File loaded:', fileData.filename);
        });

        AppState.on('resultsChanged', (results) => {
            console.log('✅ Results ready');
        });
    },

    // Handle window resize
    handleResize() {
        const isMobile = window.innerWidth < 768;

        // Toggle heavy effects on mobile
        const bgCanvas = DOM.get('bg-canvas');
        if (bgCanvas) {
            bgCanvas.style.display = isMobile ? 'none' : 'block';
        }
    }
};

// Global scroll to upload function
function scrollToUpload() {
    DOM.scrollTo('upload-panel', 80);
}

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});