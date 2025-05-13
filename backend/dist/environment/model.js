"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.embeddingModel = exports.createModel = void 0;
const google_genai_1 = require("@langchain/google-genai");
const createModel = (env) => {
    if (!env.GOOGLE_API_KEY) {
        throw new Error("GOOGLE_API_KEY is not configured");
    }
    return new google_genai_1.ChatGoogleGenerativeAI({
        model: "gemini-2.0-flash",
        apiKey: env.GOOGLE_API_KEY,
        streaming: true,
        maxOutputTokens: 2048,
        temperature: 0.7,
    });
};
exports.createModel = createModel;
const embeddingModel = (env) => {
    if (!env.GOOGLE_API_KEY) {
        throw new Error("GOOGLE_API_KEY is not configured");
    }
    return new google_genai_1.GoogleGenerativeAIEmbeddings({
        model: "embedding-001",
        apiKey: env.GOOGLE_API_KEY,
    });
};
exports.embeddingModel = embeddingModel;
