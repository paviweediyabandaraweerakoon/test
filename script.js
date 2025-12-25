// Chatbot Application
class Chatbot {
    constructor() {
        // API Key and Model - will be loaded from config
        this.apiKey = '';
        this.model = 'meta-llama/llama-3.2-3b-instruct:free';

        // Shop assistant system prompt
        this.systemPrompt = `You are a helpful shop assistant chatbot. Answer customer questions about products, prices, availability, and recommendations.

IMPORTANT RULES:
1. If product information is provided in the context, use EXACT prices and details from that data
2. If a product is NOT in the database, say "I don't have specific information about that product. Please contact our store for details."
3. Be friendly, helpful, and concise
4. For product recommendations, only recommend products that are in the provided context
5. Always mention stock status when discussing products`;
        this.conversationHistory = [];
        this.ragBackend = new RAGBackend();
        this.supabase = null;

        this.initElements();
        this.initEventListeners();
        this.loadSettings();
        this.loadConfig().then(() => this.loadProducts());
    }

    // Load API config from Supabase or config.js
    async loadConfig() {
        // Try to load from Supabase first
        if (this.initSupabase()) {
            try {
                const { data, error } = await this.supabase
                    .from('config')
                    .select('*');

                if (!error && data) {
                    for (const item of data) {
                        if (item.key === 'openrouter_api_key') this.apiKey = item.value;
                        if (item.key === 'chatbot_model') this.model = item.value;
                    }
                    if (this.apiKey) {
                        console.log('Loaded API config from Supabase');
                        return;
                    }
                }
            } catch (e) {
                console.log('Config table not found:', e.message);
            }
        }

        // Fallback to localStorage (same domain only)
        this.apiKey = localStorage.getItem('openrouter_api_key') || '';
        this.model = localStorage.getItem('chatbot_model') || 'meta-llama/llama-3.2-3b-instruct:free';

        // Fallback to config.js if exists
        if (!this.apiKey && window.CHATBOT_CONFIG) {
            this.apiKey = window.CHATBOT_CONFIG.apiKey || '';
            this.model = window.CHATBOT_CONFIG.model || this.model;
        }

        console.log('API Key loaded:', this.apiKey ? 'Yes' : 'No');
    }

    // Initialize Supabase client
    initSupabase() {
        // Hardcoded Supabase config for cross-domain access
        const SUPABASE_URL = 'https://brwgyojtthrrenhxlsio.supabase.co';
        const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyd2d5b2p0dGhycmVuaHhsc2lvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1NjE4ODIsImV4cCI6MjA4MjEzNzg4Mn0.gMEw6OqFcfhLQ8dEeOHRfXE431N2ZJVi7dQdcUq1yHM';

        // Use hardcoded or localStorage
        const url = SUPABASE_URL || localStorage.getItem('supabase_url');
        const key = SUPABASE_KEY || localStorage.getItem('supabase_key');
        if (url && key && window.supabase) {
            this.supabase = window.supabase.createClient(url, key);
            return true;
        }
        return false;
    }

    // Load products - try Supabase first, then fallback to JSON
    async loadProducts() {
        // Clear existing products
        await this.ragBackend.clearAll();

        // Try Supabase first
        if (this.initSupabase()) {
            try {
                const { data, error } = await this.supabase
                    .from('products')
                    .select('*');

                if (!error && data && data.length > 0) {
                    for (const product of data) {
                        const content = `Product: ${product.name}. Price: ${product.price}. Category: ${product.category}. Stock: ${product.stock}. Description: ${product.description}`;
                        await this.ragBackend.addDocument(product.name, content, {
                            ...product,
                            type: 'product'
                        });
                    }
                    console.log(`Loaded ${data.length} products from Supabase`);
                    return;
                }
            } catch (e) {
                console.log('Supabase error, falling back to JSON:', e.message);
            }
        }

        // Fallback to products.json
        try {
            const response = await fetch('products.json');
            if (!response.ok) return;
            const products = await response.json();

            for (const product of products) {
                const content = `Product: ${product.name}. Price: ${product.price}. Category: ${product.category}. Stock: ${product.stock}. Description: ${product.description}`;
                await this.ragBackend.addDocument(product.name, content, {
                    ...product,
                    type: 'product'
                });
            }
            console.log(`Loaded ${products.length} products from products.json`);
        } catch (error) {
            console.log('No products loaded:', error.message);
        }
    }

    initElements() {
        this.messagesArea = document.getElementById('messagesArea');
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.typingIndicator = document.getElementById('typingIndicator');
        // Settings elements (optional - may not exist on user widget)
        this.settingsModal = document.getElementById('settingsModal');
        this.settingsBtn = document.getElementById('settingsBtn');
        this.closeModalBtn = document.getElementById('closeModalBtn');
        this.saveSettingsBtn = document.getElementById('saveSettingsBtn');
        this.apiKeyInput = document.getElementById('apiKeyInput');
        this.modelSelect = document.getElementById('modelSelect');
        this.systemPromptInput = document.getElementById('systemPromptInput');
    }

    initEventListeners() {
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Auto-resize textarea
        this.messageInput.addEventListener('input', () => {
            this.messageInput.style.height = 'auto';
            this.messageInput.style.height = this.messageInput.scrollHeight + 'px';
        });

        // Settings modal (only if elements exist)
        if (this.settingsBtn) {
            this.settingsBtn.addEventListener('click', () => this.openSettings());
        }
        if (this.closeModalBtn) {
            this.closeModalBtn.addEventListener('click', () => this.closeSettings());
        }
        if (this.saveSettingsBtn) {
            this.saveSettingsBtn.addEventListener('click', () => this.saveSettings());
        }

        // Close modal on outside click (only if modal exists)
        if (this.settingsModal) {
            this.settingsModal.addEventListener('click', (e) => {
                if (e.target === this.settingsModal) {
                    this.closeSettings();
                }
            });
        }
    }

    loadSettings() {
        // Only load if settings elements exist
        if (this.apiKeyInput) this.apiKeyInput.value = this.apiKey;
        if (this.modelSelect) this.modelSelect.value = this.model;
        if (this.systemPromptInput) this.systemPromptInput.value = this.systemPrompt;
    }

    openSettings() {
        this.settingsModal.classList.add('active');
    }

    closeSettings() {
        this.settingsModal.classList.remove('active');
    }

    saveSettings() {
        this.apiKey = this.apiKeyInput.value.trim();
        this.model = this.modelSelect.value;
        this.systemPrompt = this.systemPromptInput.value.trim() || 'You are a helpful AI assistant.';

        localStorage.setItem('openrouter_api_key', this.apiKey);
        localStorage.setItem('chatbot_model', this.model);
        localStorage.setItem('system_prompt', this.systemPrompt);

        this.closeSettings();
        this.showNotification('Settings saved successfully!');
    }

    showNotification(message) {
        // Simple notification (you can enhance this)
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            padding: 16px 24px;
            border-radius: 12px;
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
            z-index: 10000;
            animation: slideInRight 0.3s ease-out;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message) return;

        // Clear input
        this.messageInput.value = '';
        this.messageInput.style.height = 'auto';

        // Remove welcome message if exists
        const welcomeMsg = this.messagesArea.querySelector('.welcome-message');
        if (welcomeMsg) {
            welcomeMsg.remove();
        }

        // Add user message
        this.addMessage(message, 'user');

        // Add to conversation history
        this.conversationHistory.push({
            role: 'user',
            content: message
        });

        // Show typing indicator
        this.typingIndicator.classList.add('active');
        this.sendBtn.disabled = true;

        try {
            // Retrieve context from RAG
            const context = await this.ragBackend.retrieveContext(message);

            // Get AI response
            const response = await this.getAIResponse(message, context);

            // Hide typing indicator
            this.typingIndicator.classList.remove('active');

            // Add bot message
            this.addMessage(response, 'bot');

            // Add to conversation history
            this.conversationHistory.push({
                role: 'assistant',
                content: response
            });

        } catch (error) {
            this.typingIndicator.classList.remove('active');
            // Show the actual error message for debugging
            const errorMsg = error.message || 'Unknown error occurred';
            this.addMessage(`Error: ${errorMsg}`, 'bot');
            console.error('Full Error:', error);
        } finally {
            this.sendBtn.disabled = false;
        }
    }

    async getAIResponse(userMessage, context) {
        const messages = [
            {
                role: 'system',
                content: this.systemPrompt
            }
        ];

        // Add context if available
        if (context) {
            messages.push({
                role: 'system',
                content: `Here is relevant information from the knowledge base:\n\n${context}\n\nUse this information to help answer the user's question if relevant.`
            });
        }

        // Add conversation history (last 10 messages)
        const recentHistory = this.conversationHistory.slice(-10);
        messages.push(...recentHistory);

        // Add current message
        messages.push({
            role: 'user',
            content: userMessage
        });

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.href,
                'X-Title': 'AI Chatbot'
            },
            body: JSON.stringify({
                model: this.model,
                messages: messages,
                temperature: 0.7,
                max_tokens: 1000
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'API request failed');
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    addMessage(content, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = type === 'user' ? '👤' : '🤖';

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = content;

        messageDiv.appendChild(avatar);
        messageDiv.appendChild(contentDiv);

        this.messagesArea.appendChild(messageDiv);

        // Scroll to bottom
        this.messagesArea.scrollTop = this.messagesArea.scrollHeight;
    }
}

// Initialize chatbot when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.chatbot = new Chatbot();

    // Add sample data to knowledge base (for demo purposes)
    // You can remove this or add your own documents
    setTimeout(async () => {
        const docCount = await window.chatbot.ragBackend.getAllDocuments();
        if (docCount.length === 0) {
            // Add a sample document
            await window.chatbot.ragBackend.addDocument(
                'About This Chatbot',
                'This is an AI-powered chatbot that uses OpenRouter API to provide intelligent responses. It features a Retrieval-Augmented Generation (RAG) system that can retrieve relevant information from a knowledge base to provide more accurate and contextual answers. You can customize the AI model and system prompt in the settings.'
            );
        }
    }, 1000);
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
