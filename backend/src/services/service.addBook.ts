import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/pinecone";

interface Env {
  GOOGLE_API_KEY: string;
  PINECONE_API_KEY: string;
  PINECONE_INDEX: string;
}

interface BookData {
  id: string;
  title: string;
  subtitle: string;
  isbn: string;
  publicationYear: number;
  publisher: string;
  description: string;
  pageCount: number;
  language: string;
  status: string;
  authorName: string;
  content: string;
}

export class CreateLinkService {
  private embeddings: GoogleGenerativeAIEmbeddings;
  private vectorStore!: PineconeStore;
  private pinecone: PineconeClient;
  private pineconeIndex: any;
  

  constructor(env: Env) {
    if (!env.GOOGLE_API_KEY || !env.PINECONE_API_KEY || !env.PINECONE_INDEX) {
      throw new Error("Missing required environment variables for vector database");
    }
    
    // Initialize embedding model
    this.embeddings = new GoogleGenerativeAIEmbeddings({
      modelName: "embedding-001",
      apiKey: env.GOOGLE_API_KEY,
    });
    
    // Initialize Pinecone client
    this.pinecone = new PineconeClient({
      apiKey: env.PINECONE_API_KEY
    });
    
    // Get Pinecone index
    this.pineconeIndex = this.pinecone.index(env.PINECONE_INDEX);
    
    // Initialize vector store asynchronously
    this.initVectorStore().catch(error => {
      console.error("Failed to initialize vector store during construction:", error);
    });
  }

  async initVectorStore() {
    try {
      if (!this.vectorStore) {
        console.log('Initializing Pinecone vector store...');
        
        // Validate that index is accessible before proceeding
        try {
          await this.pineconeIndex.describeIndexStats();
        } catch (indexError) {
          console.error('Failed to access Pinecone index:', indexError);
          throw new Error('Could not access Pinecone index. Please verify your index name and API key.');
        }
        
        this.vectorStore = await PineconeStore.fromExistingIndex(this.embeddings, {
          pineconeIndex: this.pineconeIndex,
          namespace: 'default'
        });
        
        console.log('Vector store initialized successfully');
      }
      return this.vectorStore;
    } catch (error) {
      console.error('Error initializing vector store:', error);
      throw new Error(`Failed to initialize vector store: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async addToVectorStore(bookData: BookData) {
    const {
      id, title, subtitle, isbn, publicationYear, 
      publisher, description, pageCount, language, 
      status, authorName, content
    } = bookData;

    try {
      // Validate essential fields
      if (!id || !content) {
        throw new Error('Missing required fields for vector storage: id or content');
      }

      // Ensure vector store is initialized
      if (!this.vectorStore) {
        console.log('Vector store not initialized, calling initVectorStore...');
        await this.initVectorStore();
      }
      
      // Process content for better search results
      const processedContent = this.preprocessContent(content, title, description);
      
      // Add document to vector store
      console.log(`Adding document to Pinecone with ID: ${id}`);
      await this.vectorStore.addDocuments(
        [
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
        ],
        { ids: [id] }
      );
      
      console.log(`Successfully added document to vector store: ${id}`);
      return true;
    } catch (error) {
      console.error('Error adding to vector store:', error);
      console.error('Error details:', error instanceof Error ? error.message : error);
      throw new Error(`Failed to add document to vector store: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  // Helper method to preprocess content for better search results
  private preprocessContent(content: string, title: string, description: string): string {
    // Combine title and description with content for better context
    const combinedContent = `Title: ${title}\n\nDescription: ${description}\n\nContent: ${content}`;
    
    // Trim and clean content if it's too long (Pinecone may have limits)
    return combinedContent.length > 100000 ? combinedContent.substring(0, 100000) : combinedContent;
  }

  async deleteFromVectorStore(linkId: string) {
    try {
      if (!linkId) {
        console.error('Invalid ID provided for deletion');
        return false;
      }
      
      if (!this.vectorStore) {
        await this.initVectorStore();
      }
      
      await this.vectorStore.delete({ ids: [linkId] });
      console.log("Successfully deleted document from vector store:", linkId);
      return true;
    } catch (error) {
      console.error("Error deleting from vector store:", error);
      // Don't throw, just log the error and return false to indicate failure
      return false;
    }
  }

 



  /**
   * Adds a book's content to the vector database for semantic search
   * @param params Book data including content to be vectorized
   * @returns Promise resolving to true if successful
   */
  async createLink(params: BookData): Promise<boolean> {
    try {
      // Add with proper await to ensure errors are caught here
      await this.addToVectorStore(params);
      return true;
    } catch (error) {
      console.error('Error creating link:', error);
      throw new Error(`Failed to create link in vector database: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Searches for similar book content in the vector database
   * @param query Search query text
   * @param limit Maximum number of results to return
   * @returns Promise with search results including book metadata
   */
  async searchSimilarContent(query: string, limit: number = 5) {
    try {
      if (!this.vectorStore) {
        await this.initVectorStore();
      }
      
      // First convert the query string to a vector embedding
      const queryEmbedding = await this.embeddings.embedQuery(query);
      
      // Then use the vector for search
      const results = await this.vectorStore.similaritySearchVectorWithScore(queryEmbedding, limit);
      
      // Format and return results
      // Results are in format [document, score]
      return results.map(([document, score]: [{ pageContent: string; metadata: any }, number]) => ({
        score,
        content: document.pageContent,
        metadata: document.metadata
      }));
    } catch (error) {
      console.error('Error searching vector database:', error);
      throw new Error(`Failed to search vector database: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
