import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { VectorStore } from "@langchain/core/vectorstores";
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import { tool } from "@langchain/core/tools";
import { z } from 'zod';
import { config } from "dotenv";
import { combineAndRankResults, formatSearchResults, SearchResult } from "./helper";


config();


export const InputSchema = z.object({
  userInput: z.string().min(1, "User input cannot be empty"),
  userId: z.string().min(1, "User ID cannot be empty")
});


export type AgentResult = {
  output: string;
  intermediateSteps: any[];
};


export class ChatService {
  private model: ChatGoogleGenerativeAI;
  private vectorStore: VectorStore;
  private systemPrompt: string;
  private tools: any[];
  private agentExecutor: AgentExecutor | null = null;
  private initPromise: Promise<void>;


  constructor(model: ChatGoogleGenerativeAI, systemPrompt: string, vectorStore: VectorStore ) {
    this.model = model;
    this.systemPrompt = systemPrompt;
    this.vectorStore = vectorStore;
    this.tools = [];

    this.initPromise = this.initializeToolsAndAgent();
  }

  private async performVectorSearch(
    vectorStore: VectorStore,
    query: string,
    topK: number = 5
  ): Promise<SearchResult[]> {
    try {
      console.log(`Performing vector search for query: "${query}" `);

      
      // Try with direct filter
      const results = await vectorStore.similaritySearchWithScore(query, topK);
      console.log(`Search results for "${query}":`, 
        results.length > 0 ? 
          `Found ${results.length} results` : 
          "No results found");
      
      if (results.length === 0) {
        // If no results, try with userId as a number
        
        const numericResults = await vectorStore.similaritySearchWithScore(query, topK);
        console.log(`Alternative search results:`, 
          numericResults.length > 0 ? 
            `Found ${numericResults.length} results` : 
            "No results found with numeric userId");
            
        if (numericResults.length > 0) {
          return numericResults.map(([document, score]) => ({
            title: document.metadata.title,
            description: document.metadata.description,
            url: document.metadata.url,
            linkId: document.metadata.linkId,
            body: document.metadata.body,
            score: score
          }));
        }
      }
      
      // Log the first result's metadata if available
      if (results.length > 0) {
        console.log("First result document metadata:", results[0][0].metadata);
        console.log("First result score:", results[0][1]);
      }
      
      return results.map(([document, score]) => ({
        title: document.metadata.title,
        description: document.metadata.description,
        url: document.metadata.url,
        body: document.metadata.body,
        linkId: document.metadata.linkId,
        score: score
      }));
    } catch (error) {
      console.error(`Error in vector search for query "${query}":`, error);
      return [];
    }
  }

  private async initializeToolsAndAgent(): Promise<void> {
    try {
      // Define tools
    //   const userFolderTool = tool(
    //     async ({ userId }: { userId: string }): Promise<string> => {
    //       const res = await prisma.folder.findMany({
    //         where:{
    //           userID : parseInt(userId),
    //         },
    //         select:{
    //           name : true,
    //         }
    //       })
    //       return `Folders are ${res.map(f => f.name).join(", ")}`;
    //     },
    //     {
    //       name: "User_Folder",
    //       description: "Retrieves all folder names created by the user",
    //       schema: z.object({
    //         userId: z.string().describe("The ID of the user whose folders to retrieve"),
    //       }),
    //     }
    //   );

      const vectorSearchTool = tool(
        async ({ queries }: { queries: string[]; }): Promise<string> => {

          // Execute searches for each query in parallel
          const searchPromises = queries.map(query => 
           this.performVectorSearch(this.vectorStore, query)
          );
    
          const allResults = await Promise.all(searchPromises);
   
          const rankedResults = combineAndRankResults(allResults);
    
 
          return formatSearchResults(rankedResults);

        },
        {
          name: "Vector_Search",
          description:
            "Performs a vector similarity search books vector db to get the most relvant data and books data . ",
          schema: z.object({
            queries: z
              .array(z.string())
              .min(1)
              .max(4)
              .describe("Questions to perform vector similarity search with"),
          }),
        }
      );

      this.tools = [vectorSearchTool];

      // Create chat prompt template
      const prompt = ChatPromptTemplate.fromMessages([
        ["system", "{systemMessage}"],
        ["human", "{input}"],
        ["placeholder", "{agent_scratchpad}"],
      ]);

      // Create tool-calling agent
      const agent = await createToolCallingAgent({
        llm: this.model,
        tools: this.tools,
        prompt,
      });

      // Create agent executor
      this.agentExecutor = new AgentExecutor({
        agent,
        tools: this.tools,

      });
    } catch (error) {
      console.error("Failed to initialize tools and agent:", error);
      throw new Error("Failed to initialize ChatService");
    }
  }

  private async *chunkText(text: string, chunkSize: number = 3): AsyncGenerator<string> {
    // First yield an empty string to create the assistant message container
    yield '';
    
    // Split the text into small chunks for the typing effect
    const words = text.split(' ');
    let currentChunk = '';
    
    for (const word of words) {
      currentChunk += word + ' ';
      if (currentChunk.length >= chunkSize || word.includes('\n')) {
        yield currentChunk;
        currentChunk = '';
        // Add a small delay to simulate typing
        await new Promise(resolve => setTimeout(resolve, 20));
      }
    }
    
    // Yield any remaining text
    if (currentChunk) {
      yield currentChunk;
    }
  }

  async *processUserInput(params: { userInput: string; userId: string }):  AsyncGenerator<string> {
    const validationResult = InputSchema.safeParse(params);
    if (!validationResult.success) {
      throw new Error(`Invalid input: ${validationResult.error.message}`);
    }

    const { userInput, userId } = params;

    try {
      await this.initPromise;
      
      if (!this.agentExecutor) {
        throw new Error("Agent executor not initialized");
      }

      const systemMessageWithUserId = `${this.systemPrompt}\n\nIMPORTANT: When searching or retrieving user data, ALWAYS use the current user's ID: ${userId}. Do not make up or use any other user ID.`;
      
      const agentResult = await this.agentExecutor.streamEvents({
        input: userInput,
        userId: userId,
        systemMessage: systemMessageWithUserId
      },{
        version: "v2",
      });

      try {
        let completeResponseText = '';
        
        for await (const event of agentResult) {
          // Gather content from LLM stream events
          if (event.event === 'on_llm_stream' && event.data?.chunk?.message?.content) {
            completeResponseText += event.data.chunk.message.content;
          }
          // Get complete response from parser end events
          else if (event.event === 'on_parser_end' && event.data?.output?.returnValues?.output) {
            completeResponseText = event.data.output.returnValues.output;
          }
          // Fallback to chain end events with direct output
          else if (event.event === 'on_chain_end' && typeof event.data?.output === 'string') {
            completeResponseText = event.data.output;
          }
        }
        
        for await (const chunk of this.chunkText(completeResponseText)) {
          yield chunk;
        }
      } catch (streamError) {
        console.error("Error streaming agent results:", streamError);
        yield `Error in AI response stream: ${streamError instanceof Error ? streamError.message : 'Unknown streaming error'}`;
      }
    } catch (error) {
      console.error("Error processing user input:", error);
      throw new Error(`Failed to process user input: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}