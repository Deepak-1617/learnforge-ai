/* ============================================
   DOM UTILITY FUNCTIONS
   ============================================ */

   const DOM = {
    // Get element by ID
    get(id) {
        return document.getElementById(id);
    },

    // Get element by selector
    select(selector) {
        return document.querySelector(selector);
    },

    // Get all elements by selector
    selectAll(selector) {
        return document.querySelectorAll(selector);
    },

    // Create element with attributes
    create(tag, attributes = {}, children = []) {
        const element = document.createElement(tag);
        
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'innerHTML') {
                element.innerHTML = value;
            } else if (key.startsWith('on')) {
                element.addEventListener(key.slice(2).toLowerCase(), value);
            } else {
                element.setAttribute(key, value);
            }
        });

        children.forEach(child => {
            if (typeof child === 'string') {
                element.appendChild(document.createTextNode(child));
            } else if (child instanceof HTMLElement) {
                element.appendChild(child);
            }
        });

        return element;
    },

    // Show element
    show(element) {
        if (typeof element === 'string') {
            element = this.get(element);
        }
        element?.classList.remove('hidden');
    },

    // Hide element
    hide(element) {
        if (typeof element === 'string') {
            element = this.get(element);
        }
        element?.classList.add('hidden');
    },

    // Toggle element visibility
    toggle(element) {
        if (typeof element === 'string') {
            element = this.get(element);
        }
        element?.classList.toggle('hidden');
    },

    // Add class
    addClass(element, className) {
        if (typeof element === 'string') {
            element = this.get(element);
        }
        element?.classList.add(className);
    },

    // Remove class
    removeClass(element, className) {
        if (typeof element === 'string') {
            element = this.get(element);
        }
        element?.classList.remove(className);
    },

    // Set text content
    setText(element, text) {
        if (typeof element === 'string') {
            element = this.get(element);
        }
        if (element) element.textContent = text;
    },

    // Set HTML content
    setHTML(element, html) {
        if (typeof element === 'string') {
            element = this.get(element);
        }
        if (element) element.innerHTML = html;
    },

    // Clear element
    clear(element) {
        if (typeof element === 'string') {
            element = this.get(element);
        }
        if (element) element.innerHTML = '';
    },

    // Scroll to element smoothly
    scrollTo(element, offset = 0) {
        if (typeof element === 'string') {
            element = this.get(element);
        }
        if (element) {
            const top = element.getBoundingClientRect().top + window.pageYOffset - offset;
            window.scrollTo({ top, behavior: 'smooth' });
        }
    },

    // Create ripple effect
    createRipple(event, element) {
        const ripple = document.createElement('span');
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;

        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('ripple');

        element.appendChild(ripple);

        setTimeout(() => ripple.remove(), 600);
    }
};

// Make globally available
window.DOM = DOM;