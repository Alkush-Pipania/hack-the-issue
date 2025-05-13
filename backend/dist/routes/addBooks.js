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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = __importDefault(require("../lib/prisma"));
const uuid_1 = require("uuid");
const service_addBook_1 = require("../services/service.addBook");
const router = (0, express_1.Router)();
// Define validation schema for adding books
const addBookSchema = zod_1.z.object({
    title: zod_1.z.string(),
    subtitle: zod_1.z.string(),
    isbn: zod_1.z.string(),
    publicationYear: zod_1.z.number(),
    publisher: zod_1.z.string(),
    description: zod_1.z.string(),
    pageCount: zod_1.z.number(),
    language: zod_1.z.string(),
    status: zod_1.z.string(),
    authorName: zod_1.z.string().or(zod_1.z.array(zod_1.z.string())),
    content: zod_1.z.string() // Accept single author or array of authors
});
const addBook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const input = addBookSchema.safeParse(req.body);
    if (!input.success) {
        res.status(400).json({ message: "Invalid input", errors: input.error.errors });
        return;
    }
    const { title, subtitle, isbn, publicationYear, publisher, description, pageCount, language, status, authorName, content } = input.data;
    try {
        // Check if book with this ISBN already exists
        const existingBook = yield prisma_1.default.books.findUnique({
            where: { isbn },
            select: { id: true }
        });
        if (existingBook) {
            res.status(409).json({
                message: "Book with this ISBN already exists",
                bookId: existingBook.id
            });
            return;
        }
        // Create new book
        const newBook = yield prisma_1.default.books.create({
            data: {
                title,
                subtitle,
                isbn,
                publicationYear,
                publisher,
                description,
                pageCount,
                language,
                status: status,
                id: (0, uuid_1.v4)(),
                updatedAt: new Date(),
            },
            select: {
                id: true
            }
        });
        // Handle author connection
        if (authorName) {
            const authors = Array.isArray(authorName) ? authorName : [authorName];
            // For each author name, find or create the author and connect to the book
            for (const name of authors) {
                // Find or create author
                let author = yield prisma_1.default.authors.findFirst({
                    where: { name }
                });
                if (!author) {
                    author = yield prisma_1.default.authors.create({
                        data: {
                            id: (0, uuid_1.v4)(),
                            name
                        }
                    });
                }
                // Connect author to book
                yield prisma_1.default.author_books.create({
                    data: {
                        bookId: newBook.id,
                        authorId: author.id
                    }
                });
            }
        }
        // Initialize vector database service
        const createLinkService = new service_addBook_1.CreateLinkService({
            GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
            PINECONE_API_KEY: process.env.PINECONE_API_KEY,
            PINECONE_INDEX: process.env.PINECONE_INDEX,
        });
        // Add book content to vector database
        try {
            // Convert author array to string for metadata
            const authorNameString = Array.isArray(authorName) ? authorName.join(", ") : authorName;
            // Store book content in vector database
            yield createLinkService.createLink({
                id: newBook.id,
                title,
                subtitle,
                isbn,
                publicationYear,
                publisher,
                description,
                pageCount,
                language,
                status,
                authorName: authorNameString,
                content
            });
            // Return success response
            res.status(201).json({
                message: "Book created successfully",
                book: newBook
            });
        }
        catch (vectorError) {
            console.error("Error adding book to vector database:", vectorError);
            // Book is already created in database, so return partial success
            res.status(201).json({
                message: "Book created successfully, but failed to index content",
                book: newBook
            });
        }
    }
    catch (error) {
        console.error("Error creating book:", error);
        res.status(500).json({
            message: "Failed to create book",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
});
router.post("/", addBook);
exports.default = router;
