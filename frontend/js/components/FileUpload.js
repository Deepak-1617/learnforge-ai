/* ============================================
   FILE UPLOAD COMPONENT
   Handles drag & drop, file selection,
   upload to backend, preview display
   ============================================ */

   const FileUpload = {
    // DOM Elements
    elements: {
        uploadZone: null,
        fileInput: null,
        browseBtn: null,
        filePreview: null,
        fileName: null,
        fileMeta: null,
        previewText: null,
        removeBtn: null,
        generateBtn: null
    },

    // Allowed file types
    allowedTypes: ['.pdf', '.docx', '.txt'],
    maxSize: 10 * 1024 * 1024, // 10MB

    // Initialize
    init() {
        this.elements = {
            uploadZone: DOM.get('upload-zone'),
            fileInput: DOM.get('file-input'),
            browseBtn: DOM.get('browse-btn'),
            filePreview: DOM.get('file-preview'),
            fileName: DOM.get('file-name'),
            fileMeta: DOM.get('file-meta'),
            previewText: DOM.get('preview-text'),
            removeBtn: DOM.get('remove-file'),
            generateBtn: DOM.get('generate-btn')
        };

        this.bindEvents();
    },

    // Bind all events
    bindEvents() {
        const { uploadZone, fileInput, browseBtn, removeBtn } = this.elements;

        // Browse button click
        browseBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            fileInput?.click();
        });

        // Upload zone click
        uploadZone?.addEventListener('click', () => {
            fileInput?.click();
        });

        // File input change
        fileInput?.addEventListener('change', (e) => {
            const file = e.target.files?.[0];
            if (file) this.handleFile(file);
        });

        // Drag and drop events
        uploadZone?.addEventListener('dragenter', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.handleDragEnter();
        });

        uploadZone?.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
        });

        uploadZone?.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.handleDragLeave();
        });

        uploadZone?.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.handleDragLeave();
            const file = e.dataTransfer?.files?.[0];
            if (file) this.handleFile(file);
        });

        // Remove file button
        removeBtn?.addEventListener('click', () => {
            this.clearFile();
        });

        // Generate button
        this.elements.generateBtn?.addEventListener('click', (e) => {
            DOM.createRipple(e, this.elements.generateBtn);
            this.startGeneration();
        });
    },

    // Handle drag enter
    handleDragEnter() {
        this.elements.uploadZone?.classList.add('drag-over');
    },

    // Handle drag leave
    handleDragLeave() {
        this.elements.uploadZone?.classList.remove('drag-over');
    },

    // Handle file selection
    async handleFile(file) {
        // Validate file type
        const ext = '.' + file.name.split('.').pop().toLowerCase();
        if (!this.allowedTypes.includes(ext)) {
            this.showError(`Invalid file type. Allowed: ${this.allowedTypes.join(', ')}`);
            return;
        }

        // Validate file size
        if (file.size > this.maxSize) {
            this.showError('File too large. Maximum size is 10MB.');
            return;
        }

        // Show upload animation
        LoadingEffects.showUploadAnimation(file.name);

        // Upload to backend
        const result = await this.uploadFile(file);

        // Hide upload animation
        LoadingEffects.hideUploadAnimation();

        if (result.success) {
            this.showFilePreview(file, result);
            AppState.setFile(result);
        } else {
            this.showError(result.error || 'Upload failed. Please try again.');
        }
    },

    // Upload file to backend
    async uploadFile(file) {
        try {
            AppState.setUIState({ isUploading: true });
            const result = await API.uploadFile(file);
            AppState.setUIState({ isUploading: false });
            return result;
        } catch (error) {
            AppState.setUIState({ isUploading: false });
            return { success: false, error: error.message };
        }
    },

    // Show file preview
    showFilePreview(file, data) {
        const { filePreview, fileName, fileMeta, previewText, generateBtn, uploadZone } = this.elements;

        // Update file info
        if (fileName) fileName.textContent = file.name;
        if (fileMeta) {
            fileMeta.textContent = `${Helpers.formatFileSize(file.size)} • ${data.char_count?.toLocaleString()} characters`;
        }

        // Show preview text with typewriter effect
        if (previewText && data.preview) {
            LoadingEffects.typewriter(previewText, data.preview, 10);
        }

        // Show file preview panel
        DOM.show(filePreview);

        // Show generate button
        DOM.show(generateBtn);

        // Add success glow to upload zone
        if (uploadZone) {
            uploadZone.classList.add('glow-border');
            setTimeout(() => uploadZone.classList.remove('glow-border'), 3000);
        }

        // Particle burst
        const rect = uploadZone?.getBoundingClientRect();
        if (rect) {
            Helpers.createParticleBurst(
                rect.left + rect.width / 2,
                rect.top + rect.height / 2,
                25
            );
        }

        // Scroll to generate button
        setTimeout(() => {
            DOM.scrollTo('generate-btn', 100);
        }, 500);
    },

    // Clear file
    clearFile() {
        const { filePreview, generateBtn, fileInput } = this.elements;

        DOM.hide(filePreview);
        DOM.hide(generateBtn);

        // Reset file input
        if (fileInput) fileInput.value = '';

        // Reset state
        AppState.clearFile();

        // Hide results
        DOM.hide('results-section');

        // Scroll to top
        DOM.scrollTo('upload-section', 80);
    },

    // Start content generation
    async startGeneration() {
        if (!AppState.fileId) {
            this.showError('Please upload a file first.');
            return;
        }

        if (!AppState.aiStatus.available) {
            this.showError('AI is not available. Please check the backend connection.');
            return;
        }

        // Show AI loader
        LoadingEffects.showAILoader();
        AppState.setUIState({ isGenerating: true });

        // Hide results section
        DOM.hide('results-section');

        // Call API
        const result = await API.generateContent(AppState.fileId, 'all');

        // Hide loader
        LoadingEffects.hideAILoader();
        AppState.setUIState({ isGenerating: false });

        if (result.success) {
            // Update state with results
            AppState.setResults(result);

            // Render results
            this.renderResults(result);

            // Show success animation
            LoadingEffects.showSuccessAnimation();

            // Show generate button again
            DOM.show('generate-btn');
        } else {
            DOM.show('generate-btn');
            this.showError(result.error || 'Generation failed. Please try again.');
        }
    },

    // Render all results
    renderResults(data) {
        // Render each content type
        if (data.quizzes) QuizCard.render(data.quizzes);
        if (data.flashcards) FlashCard.render(data.flashcards);
        if (data.tricks) TrickCard.render(data.tricks);
        if (data.summary) SummaryPanel.render(data.summary);

        // Show results section
        DOM.show('results-section');

        // Re-initialize interactions for new elements
        Interactions.initTiltEffect();

        // Animate results in
        setTimeout(() => {
            DOM.scrollTo('results-section', 80);
        }, 300);
    },

    // Show error message
    showError(message) {
        // Remove existing errors
        document.querySelectorAll('.error-toast').forEach(e => e.remove());

        const toast = DOM.create('div', {
            className: 'error-toast',
            innerHTML: `
                <span class="error-icon">⚠️</span>
                <span class="error-message">${message}</span>
                <button class="error-close" onclick="this.parentElement.remove()">✕</button>
            `
        });

        // Add styles
        toast.style.cssText = `
            position: fixed;
            bottom: 24px;
            right: 24px;
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 16px 20px;
            background: rgba(255, 0, 110, 0.15);
            border: 1px solid rgba(255, 0, 110, 0.5);
            border-radius: 12px;
            backdrop-filter: blur(12px);
            color: white;
            font-size: 14px;
            font-weight: 500;
            z-index: 9999;
            animation: slideInRight 0.3s ease-out;
            max-width: 400px;
        `;

        const closeBtn = toast.querySelector('.error-close');
        if (closeBtn) {
            closeBtn.style.cssText = `
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                font-size: 16px;
                padding: 0;
                margin-left: 8px;
                opacity: 0.7;
            `;
        }

        document.body.appendChild(toast);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.style.opacity = '0';
                setTimeout(() => toast.remove(), 300);
            }
        }, 5000);
    },

    // Show success toast
    showSuccess(message) {
        document.querySelectorAll('.success-toast').forEach(e => e.remove());

        const toast = DOM.create('div', {
            className: 'success-toast',
            innerHTML: `
                <span class="success-icon">✅</span>
                <span class="success-message">${message}</span>
            `
        });

        toast.style.cssText = `
            position: fixed;
            bottom: 24px;
            right: 24px;
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 16px 20px;
            background: rgba(6, 255, 165, 0.15);
            border: 1px solid rgba(6, 255, 165, 0.5);
            border-radius: 12px;
            backdrop-filter: blur(12px);
            color: white;
            font-size: 14px;
            font-weight: 500;
            z-index: 9999;
            animation: slideInRight 0.3s ease-out;
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            if (toast.parentElement) {
                toast.style.opacity = '0';
                setTimeout(() => toast.remove(), 300);
            }
        }, 4000);
    }
};

// Make globally available
window.FileUpload = FileUpload;