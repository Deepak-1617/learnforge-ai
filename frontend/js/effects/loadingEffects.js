/* ============================================
   LOADING & TRANSITION EFFECTS
   ============================================ */

   const LoadingEffects = {
    // Show upload animation
    showUploadAnimation(fileName) {
        const uploadZone = DOM.get('upload-zone');
        uploadZone.classList.add('uploading');

        // Create scanning effect
        const scanLine = uploadZone.querySelector('.upload-scan-line');
        if (scanLine) {
            scanLine.style.animation = 'scan-line 1s linear infinite';
        }

        // Particle burst
        const rect = uploadZone.getBoundingClientRect();
        Helpers.createParticleBurst(
            rect.left + rect.width / 2,
            rect.top + rect.height / 2,
            30
        );
    },

    // Hide upload animation
    hideUploadAnimation() {
        const uploadZone = DOM.get('upload-zone');
        uploadZone?.classList.remove('uploading');
    },

    // Show AI processing loader
    showAILoader() {
        DOM.hide('generate-btn');
        DOM.show('ai-loader');
        this.animateProcessingSteps();
    },

    // Hide AI loader
    hideAILoader() {
        DOM.hide('ai-loader');
    },

    // Animate processing steps
    async animateProcessingSteps() {
        const steps = ['step-1', 'step-2', 'step-3'];
        
        for (let i = 0; i < steps.length; i++) {
            await Helpers.wait(8000); // 8 seconds per step
            
            // Deactivate previous step
            if (i > 0) {
                DOM.removeClass(steps[i - 1], 'active');
            }
            
            // Activate current step
            DOM.addClass(steps[i], 'active');
        }
    },

    // Show success animation
    showSuccessAnimation() {
        // Create confetti
        this.createConfetti();

        // Flash success glow
        const resultsSection = DOM.get('results-section');
        if (resultsSection) {
            resultsSection.style.animation = 'glowPulse 0.5s ease-out';
            setTimeout(() => {
                resultsSection.style.animation = '';
            }, 500);
        }
    },

    // Create confetti effect
    createConfetti() {
        const colors = ['#00f0ff', '#ff006e', '#8338ec', '#06ffa5', '#ffbe0b'];
        const confettiCount = 50;

        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti-piece';
            confetti.style.left = Helpers.random(0, window.innerWidth) + 'px';
            confetti.style.top = '-10px';
            confetti.style.background = colors[Helpers.randomInt(0, colors.length - 1)];
            confetti.style.animationDelay = Helpers.random(0, 2) + 's';
            
            document.body.appendChild(confetti);
            
            setTimeout(() => confetti.remove(), 5000);
        }
    },

    // Typewriter effect for text
    typewriter(element, text, speed = 30) {
        if (typeof element === 'string') {
            element = DOM.get(element);
        }
        
        if (!element) return;

        let i = 0;
        element.textContent = '';
        
        const timer = setInterval(() => {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
            } else {
                clearInterval(timer);
            }
        }, speed);
    },

    // Progress bar animation
    animateProgressBar(element, duration = 2000) {
        if (typeof element === 'string') {
            element = DOM.get(element);
        }
        
        if (!element) return;

        element.style.width = '0%';
        element.style.transition = `width ${duration}ms ease-out`;
        
        setTimeout(() => {
            element.style.width = '100%';
        }, 10);
    }
};

// Make globally available
window.LoadingEffects = LoadingEffects;