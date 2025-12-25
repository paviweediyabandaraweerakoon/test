// RAG Backend - Knowledge Base Management and Retrieval
class RAGBackend {
    constructor() {
        this.dbName = 'ChatbotKnowledgeBase';
        this.storeName = 'documents';
        this.db = null;
        this.init();
    }

    // Initialize IndexedDB
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, { keyPath: 'id', autoIncrement: true });
                    store.createIndex('title', 'title', { unique: false });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                }
            };
        });
    }

    // Add document to knowledge base (with optional metadata for products)
    async addDocument(title, content, metadata = {}) {
        const chunks = this.chunkText(content);
        const document = {
            title,
            content,
            chunks,
            timestamp: Date.now(),
            ...metadata  // Spread metadata (name, price, category, stock, description, type)
        };

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.add(document);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Get all documents
    async getAllDocuments() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Delete document
    async deleteDocument(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // Chunk text into smaller pieces with overlap
    chunkText(text, chunkSize = 500, overlap = 50) {
        const chunks = [];
        const words = text.split(/\s+/);

        for (let i = 0; i < words.length; i += chunkSize - overlap) {
            const chunk = words.slice(i, i + chunkSize).join(' ');
            if (chunk.trim()) {
                chunks.push(chunk);
            }
        }

        return chunks;
    }

    // Calculate TF-IDF score
    calculateTFIDF(query, document) {
        const queryTerms = query.toLowerCase().split(/\s+/);
        const docTerms = document.toLowerCase().split(/\s+/);

        // Term Frequency
        const tf = {};
        queryTerms.forEach(term => {
            const count = docTerms.filter(t => t === term).length;
            tf[term] = count / docTerms.length;
        });

        // Calculate score
        let score = 0;
        queryTerms.forEach(term => {
            score += tf[term] || 0;
        });

        return score;
    }

    // Calculate cosine similarity between query and text
    cosineSimilarity(query, text) {
        const queryWords = query.toLowerCase().split(/\s+/);
        const textWords = text.toLowerCase().split(/\s+/);

        // Create word frequency maps
        const queryFreq = {};
        const textFreq = {};

        queryWords.forEach(word => {
            queryFreq[word] = (queryFreq[word] || 0) + 1;
        });

        textWords.forEach(word => {
            textFreq[word] = (textFreq[word] || 0) + 1;
        });

        // Get all unique words
        const allWords = new Set([...queryWords, ...textWords]);

        // Calculate dot product and magnitudes
        let dotProduct = 0;
        let queryMag = 0;
        let textMag = 0;

        allWords.forEach(word => {
            const qFreq = queryFreq[word] || 0;
            const tFreq = textFreq[word] || 0;

            dotProduct += qFreq * tFreq;
            queryMag += qFreq * qFreq;
            textMag += tFreq * tFreq;
        });

        queryMag = Math.sqrt(queryMag);
        textMag = Math.sqrt(textMag);

        if (queryMag === 0 || textMag === 0) return 0;

        return dotProduct / (queryMag * textMag);
    }

    // Retrieve relevant context for a query
    async retrieveContext(query, topK = 3) {
        const documents = await this.getAllDocuments();

        if (documents.length === 0) {
            return null;
        }

        // Score all chunks from all documents
        const scoredChunks = [];

        documents.forEach(doc => {
            doc.chunks.forEach(chunk => {
                const score = this.cosineSimilarity(query, chunk);
                if (score > 0) {
                    scoredChunks.push({
                        chunk,
                        score,
                        source: doc.title
                    });
                }
            });
        });

        // Sort by score and get top K
        scoredChunks.sort((a, b) => b.score - a.score);
        const topChunks = scoredChunks.slice(0, topK);

        if (topChunks.length === 0 || topChunks[0].score < 0.1) {
            return null;
        }

        // Format context
        const context = topChunks.map((item, idx) =>
            `[Source ${idx + 1}: ${item.source}]\n${item.chunk}`
        ).join('\n\n---\n\n');

        return context;
    }

    // Clear all documents
    async clearAll() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}

// Export for use in script.js
window.RAGBackend = RAGBackend;
