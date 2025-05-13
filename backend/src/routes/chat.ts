import { Router } from 'express';
import { ChatService } from '../services/chatbot-service';
import { createModel, embeddingModel } from '../environment/model';
import { systemPrompts } from '../environment/chatmodel';
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/pinecone";
import { z } from "zod";

const router = Router();

const InputSchema = z.object({
    userId: z.string(),
    userInput: z.string()
})

router.post('/', async (req: any, res: any) => {
  try {
    const result = InputSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.issues[0].message });
    }
    const { userId, userInput } = result.data;

    if (!process.env.GOOGLE_API_KEY || !process.env.PINECONE_API_KEY || !process.env.PINECONE_INDEX) {
      return res.status(500).json({ error: "Required environment variables are not configured" });
    }

    const pinecone = new PineconeClient({
      apiKey: process.env.PINECONE_API_KEY
    });
    
    const pineconeIndex = pinecone.index(process.env.PINECONE_INDEX);
    console.log(`Initialized Pinecone index: ${process.env.PINECONE_INDEX}`);
    
    const embeddings = new GoogleGenerativeAIEmbeddings({
      modelName: "embedding-001",
      apiKey: process.env.GOOGLE_API_KEY,
    });

    console.log(`Creating vector store for user ${userId}...`);
    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex,
      namespace: 'default'
    });
    console.log(`Vector store created successfully`);

    const model = createModel({
      GOOGLE_API_KEY: process.env.GOOGLE_API_KEY
    });
   
    const chatService = new ChatService(model, systemPrompts, vectorStore);
    
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Initialize the streaming process from the chat service
    const stream = chatService.processUserInput({
      userInput,
      userId
    });

    try {
      // Process each chunk of the response and send it to the client
      for await (const chunk of stream) {
        if (chunk) {
          // Send raw text without JSON stringification for word-by-word display
          res.write(`data: ${chunk}\n\n`);
          
          // Explicitly flush the response to ensure it reaches the client immediately
          if (typeof res.flush === 'function') {
            res.flush();
          }
        }
      }
      
      // Send a completion event to signal the end of the stream
      res.write(`event: complete\ndata: {}\n\n`);
    } catch (streamError) {
      console.error('Error during stream processing:', streamError);
      res.write(`event: error\ndata: ${streamError instanceof Error ? streamError.message : 'Unknown streaming error'}\n\n`);
    } finally {
      res.end();
    }
  } catch (error) {
    console.error('Error:', error);
    res.write(`event: error\ndata: ${error instanceof Error ? error.message : 'Unknown error'}\n\n`);
    res.end();
  }
});

export default router;