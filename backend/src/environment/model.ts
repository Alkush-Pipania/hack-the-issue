import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

interface Env {
  GOOGLE_API_KEY: string;
}

export const createModel = (env: Env) => {
  if (!env.GOOGLE_API_KEY) {
    throw new Error("GOOGLE_API_KEY is not configured");
  }

  return new ChatGoogleGenerativeAI({
    model: "gemini-2.0-flash",
    apiKey: env.GOOGLE_API_KEY,
    streaming : true,
    maxOutputTokens: 2048,
    temperature: 0.7,
  });
};

export const embeddingModel = (env : Env) =>{
  if (!env.GOOGLE_API_KEY) {
    throw new Error("GOOGLE_API_KEY is not configured");
  }
  return new GoogleGenerativeAIEmbeddings({
    model: "embedding-001",
    apiKey: env.GOOGLE_API_KEY ,
  });
}