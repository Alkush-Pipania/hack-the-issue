"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateLinkService = void 0;
const google_genai_1 = require("@langchain/google-genai");
const pinecone_1 = require("@pinecone-database/pinecone");
const pinecone_2 = require("@langchain/pinecone");
class CreateLinkService {
    constructor(env) {
        if (!env.GOOGLE_API_KEY || !env.PINECONE_API_KEY || !env.PINECONE_INDEX) {
            throw new Error("Missing required environment variables for vector database");
        }
        // Initialize embedding model
        this.embeddings = new google_genai_1.GoogleGenerativeAIEmbeddings({
            modelName: "embedding-001",
            apiKey: env.GOOGLE_API_KEY,
        });
        // Initialize Pinecone client
        this.pinecone = new pinecone_1.Pinecone({
            apiKey: env.PINECONE_API_KEY
        });
        // Get Pinecone index
        this.pineconeIndex = this.pinecone.index(env.PINECONE_INDEX);
        // Initialize vector store asynchronously
        this.initVectorStore().catch(error => {
            console.error("Failed to initialize vector store during construction:", error);
        });
    }
    initVectorStore() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!this.vectorStore) {
                    console.log('Initializing Pinecone vector store...');
                    // Validate that index is accessible before proceeding
                    try {
                        yield this.pineconeIndex.describeIndexStats();
                    }
                    catch (indexError) {
                        console.error('Failed to access Pinecone index:', indexError);
                        throw new Error('Could not access Pinecone index. Please verify your index name and API key.');
                    }
                    this.vectorStore = yield pinecone_2.PineconeStore.fromExistingIndex(this.embeddings, {
                        pineconeIndex: this.pineconeIndex,
                        namespace: 'default'
                    });
                    console.log('Vector store initialized successfully');
                }
                return this.vectorStore;
            }
            catch (error) {
                console.error('Error initializing vector store:', error);
                throw new Error(`Failed to initialize vector store: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });
    }
    addToVectorStore(bookData) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id, title, subtitle, isbn, publicationYear, publisher, description, pageCount, language, status, authorName, content } = bookData;
            try {
                // Validate essential fields
                if (!id || !content) {
                    throw new Error('Missing required fields for vector storage: id or content');
                }
                // Ensure vector store is initialized
                if (!this.vectorStore) {
                    console.log('Vector store not initialized, calling initVectorStore...');
                    yield this.initVectorStore();
                }
                // Process content for better search results
                const processedContent = this.preprocessContent(content, title, description);
                // Add document to vector store
                console.log(`Adding document to Pinecone with ID: ${id}`);
                yield this.vectorStore.addDocuments([
                    {
                        pageContent: processedContent,
                        metadata: {
                            id,
                            title,
                            subtitle,
                            isbn,
                            publicationYear,
                            publisher,
                            description,
                            pageCount,
                            language,
                            status,
                            authorName
                        },
                    },
                ], { ids: [id] });
                console.log(`Successfully added document to vector store: ${id}`);
                return true;
            }
            catch (error) {
                console.error('Error adding to vector store:', error);
                console.error('Error details:', error instanceof Error ? error.message : error);
                throw new Error(`Failed to add document to vector store: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });
    }
    // Helper method to preprocess content for better search results
    preprocessContent(content, title, description) {
        // Combine title and description with content for better context
        const combinedContent = `Title: ${title}\n\nDescription: ${description}\n\nContent: ${content}`;
        // Trim and clean content if it's too long (Pinecone may have limits)
        return combinedContent.length > 100000 ? combinedContent.substring(0, 100000) : combinedContent;
    }
    deleteFromVectorStore(linkId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!linkId) {
                    console.error('Invalid ID provided for deletion');
                    return false;
                }
                if (!this.vectorStore) {
                    yield this.initVectorStore();
                }
                yield this.vectorStore.delete({ ids: [linkId] });
                console.log("Successfully deleted document from vector store:", linkId);
                return true;
            }
            catch (error) {
                console.error("Error deleting from vector store:", error);
                // Don't throw, just log the error and return false to indicate failure
                return false;
            }
        });
    }
    /**
     * Adds a book's content to the vector database for semantic search
     * @param params Book data including content to be vectorized
     * @returns Promise resolving to true if successful
     */
    createLink(params) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Add with proper await to ensure errors are caught here
                yield this.addToVectorStore(params);
                return true;
            }
            catch (error) {
                console.error('Error creating link:', error);
                throw new Error(`Failed to create link in vector database: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });
    }
    /**
     * Searches for similar book content in the vector database
     * @param query Search query text
     * @param limit Maximum number of results to return
     * @returns Promise with search results including book metadata
     */
    searchSimilarContent(query_1) {
        return __awaiter(this, arguments, void 0, function* (query, limit = 5) {
            try {
                if (!this.vectorStore) {
                    yield this.initVectorStore();
                }
                // First convert the query string to a vector embedding
                const queryEmbedding = yield this.embeddings.embedQuery(query);
                // Then use the vector for search
                const results = yield this.vectorStore.similaritySearchVectorWithScore(queryEmbedding, limit);
                // Format and return results
                // Results are in format [document, score]
                return results.map(([document, score]) => ({
                    score,
                    content: document.pageContent,
                    metadata: document.metadata
                }));
            }
            catch (error) {
                console.error('Error searching vector database:', error);
                throw new Error(`Failed to search vector database: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });
    }
}
exports.CreateLinkService = CreateLinkService;
