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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chatbot_service_1 = require("../services/chatbot-service");
const model_1 = require("../environment/model");
const chatmodel_1 = require("../environment/chatmodel");
const google_genai_1 = require("@langchain/google-genai");
const pinecone_1 = require("@pinecone-database/pinecone");
const pinecone_2 = require("@langchain/pinecone");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
const InputSchema = zod_1.z.object({
    userId: zod_1.z.string(),
    userInput: zod_1.z.string()
});
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, e_1, _b, _c;
    try {
        const result = InputSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({ error: result.error.issues[0].message });
        }
        const { userId, userInput } = result.data;
        if (!process.env.GOOGLE_API_KEY || !process.env.PINECONE_API_KEY || !process.env.PINECONE_INDEX) {
            return res.status(500).json({ error: "Required environment variables are not configured" });
        }
        const pinecone = new pinecone_1.Pinecone({
            apiKey: process.env.PINECONE_API_KEY
        });
        const pineconeIndex = pinecone.index(process.env.PINECONE_INDEX);
        console.log(`Initialized Pinecone index: ${process.env.PINECONE_INDEX}`);
        const embeddings = new google_genai_1.GoogleGenerativeAIEmbeddings({
            modelName: "embedding-001",
            apiKey: process.env.GOOGLE_API_KEY,
        });
        console.log(`Creating vector store for user ${userId}...`);
        const vectorStore = yield pinecone_2.PineconeStore.fromExistingIndex(embeddings, {
            pineconeIndex,
            namespace: 'default'
        });
        console.log(`Vector store created successfully`);
        const model = (0, model_1.createModel)({
            GOOGLE_API_KEY: process.env.GOOGLE_API_KEY
        });
        const chatService = new chatbot_service_1.ChatService(model, chatmodel_1.systemPrompts, vectorStore);
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
            try {
                // Process each chunk of the response and send it to the client
                for (var _d = true, stream_1 = __asyncValues(stream), stream_1_1; stream_1_1 = yield stream_1.next(), _a = stream_1_1.done, !_a; _d = true) {
                    _c = stream_1_1.value;
                    _d = false;
                    const chunk = _c;
                    if (chunk) {
                        // Send raw text without JSON stringification for word-by-word display
                        res.write(`data: ${chunk}\n\n`);
                        // Explicitly flush the response to ensure it reaches the client immediately
                        if (typeof res.flush === 'function') {
                            res.flush();
                        }
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (!_d && !_a && (_b = stream_1.return)) yield _b.call(stream_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
            // Send a completion event to signal the end of the stream
            res.write(`event: complete\ndata: {}\n\n`);
        }
        catch (streamError) {
            console.error('Error during stream processing:', streamError);
            res.write(`event: error\ndata: ${streamError instanceof Error ? streamError.message : 'Unknown streaming error'}\n\n`);
        }
        finally {
            res.end();
        }
    }
    catch (error) {
        console.error('Error:', error);
        res.write(`event: error\ndata: ${error instanceof Error ? error.message : 'Unknown error'}\n\n`);
        res.end();
    }
}));
exports.default = router;
