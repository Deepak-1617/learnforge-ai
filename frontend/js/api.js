/* ============================================
   API COMMUNICATION WITH BACKEND
   ============================================ */

   const API = {
    // Base URL - automatically detects if on Render or localhost
    baseURL: window.location.hostname === 'localhost' 
        ? 'http://localhost:8000/api'
        : '/api',

    // Check AI provider status
    async checkAIStatus() {
        try {
            const response = await fetch(`${this.baseURL}/providers`);
            const data = await response.json();
            return {
                success: true,
                available: data.available,
                provider: data.current,
                model: data.model
            };
        } catch (error) {
            console.error('AI status check failed:', error);
            return {
                success: false,
                available: false,
                error: error.message
            };
        }
    },

    // Health check
    async healthCheck() {
        try {
            const response = await fetch(`${this.baseURL}/health`);
            const data = await response.json();
            return { success: true, ...data };
        } catch (error) {
            console.error('Health check failed:', error);
            return { success: false, error: error.message };
        }
    },

    // Upload file
    async uploadFile(file) {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${this.baseURL}/upload`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Upload failed');
            }

            const data = await response.json();
            return {
                success: true,
                file_id: data.file_id,
                filename: data.filename,
                preview: data.preview,
                char_count: data.char_count
            };
        } catch (error) {
            console.error('File upload failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },

    // Generate content
    async generateContent(fileId, contentType = 'all', customPrompt = null) {
        try {
            const response = await fetch(`${this.baseURL}/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    file_id: fileId,
                    content_type: contentType,
                    custom_prompt: customPrompt
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Generation failed');
            }

            const data = await response.json();
            return {
                success: true,
                ...data
            };
        } catch (error) {
            console.error('Content generation failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },

    // Get file info
    async getFileInfo(fileId) {
        try {
            const response = await fetch(`${this.baseURL}/files/${fileId}`);
            
            if (!response.ok) {
                throw new Error('File not found');
            }

            const data = await response.json();
            return {
                success: true,
                ...data
            };
        } catch (error) {
            console.error('Get file info failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
};

// Make globally available
window.API = API;