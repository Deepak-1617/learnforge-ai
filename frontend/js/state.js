/* ============================================
   APPLICATION STATE MANAGEMENT
   ============================================ */

   const AppState = {
    // Current file data
    currentFile: null,
    fileId: null,
    
    // AI status
    aiStatus: {
        available: false,
        provider: null,
        model: null
    },

    // Generation results
    results: {
        quizzes: null,
        flashcards: null,
        tricks: null,
        summary: null
    },

    // UI state
    ui: {
        isUploading: false,
        isGenerating: false,
        currentStep: 0
    },

    // Methods
    setFile(fileData) {
        this.currentFile = fileData;
        this.fileId = fileData.file_id;
        this.emit('fileChanged', fileData);
    },

    clearFile() {
        this.currentFile = null;
        this.fileId = null;
        this.emit('fileCleared');
    },

    setAIStatus(status) {
        this.aiStatus = { ...this.aiStatus, ...status };
        this.emit('aiStatusChanged', this.aiStatus);
    },

    setResults(results) {
        this.results = { ...this.results, ...results };
        this.emit('resultsChanged', this.results);
    },

    setUIState(state) {
        this.ui = { ...this.ui, ...state };
        this.emit('uiStateChanged', this.ui);
    },

    // Event emitter
    listeners: {},

    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    },

    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    },

    // Reset state
    reset() {
        this.currentFile = null;
        this.fileId = null;
        this.results = {
            quizzes: null,
            flashcards: null,
            tricks: null,
            summary: null
        };
        this.ui = {
            isUploading: false,
            isGenerating: false,
            currentStep: 0
        };
        this.emit('stateReset');
    }
};

// Make globally available
window.AppState = AppState;