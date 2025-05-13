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
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = Object.create((typeof AsyncIterator === "function" ? AsyncIterator : Object).prototype), verb("next"), verb("throw"), verb("return", awaitReturn), i[Symbol.asyncIterator] = function () { return this; }, i;
    function awaitReturn(f) { return function (v) { return Promise.resolve(v).then(f, reject); }; }
    function verb(n, f) { if (g[n]) { i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; if (f) i[n] = f(i[n]); } }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = exports.InputSchema = void 0;
const prompts_1 = require("@langchain/core/prompts");
const agents_1 = require("langchain/agents");
const tools_1 = require("@langchain/core/tools");
const zod_1 = require("zod");
const dotenv_1 = require("dotenv");
const helper_1 = require("./helper");
(0, dotenv_1.config)();
exports.InputSchema = zod_1.z.object({
    userInput: zod_1.z.string().min(1, "User input cannot be empty"),
    userId: zod_1.z.string().min(1, "User ID cannot be empty")
});
class ChatService {
    constructor(model, systemPrompt, vectorStore) {
        this.agentExecutor = null;
        this.model = model;
        this.systemPrompt = systemPrompt;
        this.vectorStore = vectorStore;
        this.tools = [];
        this.initPromise = this.initializeToolsAndAgent();
    }
    performVectorSearch(vectorStore_1, query_1) {
        return __awaiter(this, arguments, void 0, function* (vectorStore, query, topK = 5) {
            try {
                console.log(`Performing vector search for query: "${query}" `);
                // Try with direct filter
                const results = yield vectorStore.similaritySearchWithScore(query, topK);
                console.log(`Search results for "${query}":`, results.length > 0 ?
                    `Found ${results.length} results` :
                    "No results found");
                if (results.length === 0) {
                    // If no results, try with userId as a number
                    const numericResults = yield vectorStore.similaritySearchWithScore(query, topK);
                    console.log(`Alternative search results:`, numericResults.length > 0 ?
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
            }
            catch (error) {
                console.error(`Error in vector search for query "${query}":`, error);
                return [];
            }
        });
    }
    initializeToolsAndAgent() {
        return __awaiter(this, void 0, void 0, function* () {
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
                const vectorSearchTool = (0, tools_1.tool)((_a) => __awaiter(this, [_a], void 0, function* ({ queries }) {
                    // Execute searches for each query in parallel
                    const searchPromises = queries.map(query => this.performVectorSearch(this.vectorStore, query));
                    const allResults = yield Promise.all(searchPromises);
                    const rankedResults = (0, helper_1.combineAndRankResults)(allResults);
                    return (0, helper_1.formatSearchResults)(rankedResults);
                }), {
                    name: "Vector_Search",
                    description: "Performs a vector similarity search books vector db to get the most relvant data and books data . ",
                    schema: zod_1.z.object({
                        queries: zod_1.z
                            .array(zod_1.z.string())
                            .min(1)
                            .max(4)
                            .describe("Questions to perform vector similarity search with"),
                    }),
                });
                this.tools = [vectorSearchTool];
                // Create chat prompt template
                const prompt = prompts_1.ChatPromptTemplate.fromMessages([
                    ["system", "{systemMessage}"],
                    ["human", "{input}"],
                    ["placeholder", "{agent_scratchpad}"],
                ]);
                // Create tool-calling agent
                const agent = yield (0, agents_1.createToolCallingAgent)({
                    llm: this.model,
                    tools: this.tools,
                    prompt,
                });
                // Create agent executor
                this.agentExecutor = new agents_1.AgentExecutor({
                    agent,
                    tools: this.tools,
                });
            }
            catch (error) {
                console.error("Failed to initialize tools and agent:", error);
                throw new Error("Failed to initialize ChatService");
            }
        });
    }
    chunkText(text_1) {
        return __asyncGenerator(this, arguments, function* chunkText_1(text, chunkSize = 3) {
            // First yield an empty string to create the assistant message container
            yield yield __await('');
            // Split the text into small chunks for the typing effect
            const words = text.split(' ');
            let currentChunk = '';
            for (const word of words) {
                currentChunk += word + ' ';
                if (currentChunk.length >= chunkSize || word.includes('\n')) {
                    yield yield __await(currentChunk);
                    currentChunk = '';
                    // Add a small delay to simulate typing
                    yield __await(new Promise(resolve => setTimeout(resolve, 20)));
                }
            }
            // Yield any remaining text
            if (currentChunk) {
                yield yield __await(currentChunk);
            }
        });
    }
    processUserInput(params) {
        return __asyncGenerator(this, arguments, function* processUserInput_1() {
            var _a, e_1, _b, _c, _d, e_2, _e, _f;
            var _g, _h, _j, _k, _l, _m, _o;
            const validationResult = exports.InputSchema.safeParse(params);
            if (!validationResult.success) {
                throw new Error(`Invalid input: ${validationResult.error.message}`);
            }
            const { userInput, userId } = params;
            try {
                yield __await(this.initPromise);
                if (!this.agentExecutor) {
                    throw new Error("Agent executor not initialized");
                }
                const systemMessageWithUserId = `${this.systemPrompt}\n\nIMPORTANT: When searching or retrieving user data, ALWAYS use the current user's ID: ${userId}. Do not make up or use any other user ID.`;
                const agentResult = yield __await(this.agentExecutor.streamEvents({
                    input: userInput,
                    userId: userId,
                    systemMessage: systemMessageWithUserId
                }, {
                    version: "v2",
                }));
                try {
                    let completeResponseText = '';
                    try {
                        for (var _p = true, agentResult_1 = __asyncValues(agentResult), agentResult_1_1; agentResult_1_1 = yield __await(agentResult_1.next()), _a = agentResult_1_1.done, !_a; _p = true) {
                            _c = agentResult_1_1.value;
                            _p = false;
                            const event = _c;
                            // Gather content from LLM stream events
                            if (event.event === 'on_llm_stream' && ((_j = (_h = (_g = event.data) === null || _g === void 0 ? void 0 : _g.chunk) === null || _h === void 0 ? void 0 : _h.message) === null || _j === void 0 ? void 0 : _j.content)) {
                                completeResponseText += event.data.chunk.message.content;
                            }
                            // Get complete response from parser end events
                            else if (event.event === 'on_parser_end' && ((_m = (_l = (_k = event.data) === null || _k === void 0 ? void 0 : _k.output) === null || _l === void 0 ? void 0 : _l.returnValues) === null || _m === void 0 ? void 0 : _m.output)) {
                                completeResponseText = event.data.output.returnValues.output;
                            }
                            // Fallback to chain end events with direct output
                            else if (event.event === 'on_chain_end' && typeof ((_o = event.data) === null || _o === void 0 ? void 0 : _o.output) === 'string') {
                                completeResponseText = event.data.output;
                            }
                        }
                    }
                    catch (e_1_1) { e_1 = { error: e_1_1 }; }
                    finally {
                        try {
                            if (!_p && !_a && (_b = agentResult_1.return)) yield __await(_b.call(agentResult_1));
                        }
                        finally { if (e_1) throw e_1.error; }
                    }
                    try {
                        for (var _q = true, _r = __asyncValues(this.chunkText(completeResponseText)), _s; _s = yield __await(_r.next()), _d = _s.done, !_d; _q = true) {
                            _f = _s.value;
                            _q = false;
                            const chunk = _f;
                            yield yield __await(chunk);
                        }
                    }
                    catch (e_2_1) { e_2 = { error: e_2_1 }; }
                    finally {
                        try {
                            if (!_q && !_d && (_e = _r.return)) yield __await(_e.call(_r));
                        }
                        finally { if (e_2) throw e_2.error; }
                    }
                }
                catch (streamError) {
                    console.error("Error streaming agent results:", streamError);
                    yield yield __await(`Error in AI response stream: ${streamError instanceof Error ? streamError.message : 'Unknown streaming error'}`);
                }
            }
            catch (error) {
                console.error("Error processing user input:", error);
                throw new Error(`Failed to process user input: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });
    }
}
exports.ChatService = ChatService;
