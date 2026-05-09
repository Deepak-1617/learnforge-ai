/* ============================================
   INTERACTIVE EFFECTS
   Mouse tracking, parallax, tilt, etc.
   ============================================ */

   const Interactions = {
    init() {
        this.initCursorGlow();
        this.initParallax();
        this.initTiltEffect();
        this.initMagneticButtons();
        this.initScrollAnimations();
        this.initRippleEffect();
    },

    // Cursor glow effect
    initCursorGlow() {
        const cursorGlow = document.getElementById('cursor-glow');
        if (!cursorGlow) return;

        let isMoving = false;

        document.addEventListener('mousemove', Helpers.throttle((e) => {
            cursorGlow.style.left = e.clientX + 'px';
            cursorGlow.style.top = e.clientY + 'px';
            
            if (!isMoving) {
                cursorGlow.style.opacity = '1';
                isMoving = true;
            }
        }, 10));

        // Fade out when mouse stops
        let timer;
        document.addEventListener('mousemove', () => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                cursorGlow.style.opacity = '0';
                isMoving = false;
            }, 100);
        });
    },

    // Parallax effect on mouse move
    initParallax() {
        const parallaxElements = document.querySelectorAll('.floating-card');
        
        document.addEventListener('mousemove', Helpers.throttle((e) => {
            const mouseX = e.clientX / window.innerWidth - 0.5;
            const mouseY = e.clientY / window.innerHeight - 0.5;

            parallaxElements.forEach((element, index) => {
                const speed = (index + 1) * 20;
                const x = mouseX * speed;
                const y = mouseY * speed;
                
                element.style.transform = `translate(${x}px, ${y}px)`;
            });
        }, 50));
    },

    // 3D tilt effect on cards
    initTiltEffect() {
        const tiltCards = document.querySelectorAll('.result-card, .flashcard');

        tiltCards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                const rotateX = (y - centerY) / 10;
                const rotateY = (centerX - x) / 10;

                card.style.transform = `
                    perspective(1000px) 
                    rotateX(${rotateX}deg) 
                    rotateY(${rotateY}deg) 
                    translateY(-4px)
                `;
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
            });
        });
    },

    // Magnetic button effect
    initMagneticButtons() {
        const magneticButtons = document.querySelectorAll('.cta-button, .btn-primary');

        magneticButtons.forEach(button => {
            button.addEventListener('mousemove', (e) => {
                const rect = button.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;

                button.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px) scale(1.02)`;
            });

            button.addEventListener('mouseleave', () => {
                button.style.transform = 'translate(0, 0) scale(1)';
            });
        });
    },

    // Scroll-based animations (AOS)
    initScrollAnimations() {
        const animatedElements = document.querySelectorAll('[data-aos]');

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('aos-animate');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -100px 0px'
        });

        animatedElements.forEach(element => {
            observer.observe(element);
        });
    },

    // Ripple effect on clicks
    initRippleEffect() {
        const rippleElements = document.querySelectorAll('.btn-primary, .btn-outline, .cta-button');

        rippleElements.forEach(element => {
            element.addEventListener('click', (e) => {
                DOM.createRipple(e, element);
            });
        });
    }
};

// Make globally available
window.Interactions = Interactions;