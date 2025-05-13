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
const prisma_1 = __importDefault(require("../lib/prisma"));
const zod_1 = require("zod");
const router = (0, express_1.Router)();
const SearchBooksSchema = zod_1.z.object({
    userId: zod_1.z.string(),
    searchQuery: zod_1.z.string().optional(),
});
const GetBooks = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const input = SearchBooksSchema.safeParse(req.query);
    if (!input.success) {
        res.status(400).json("Invalid Request");
        return;
    }
    try {
        const { userId, searchQuery } = input.data;
        // If search is empty, return 5 random books
        if (!searchQuery || searchQuery.trim() === '') {
            // Get 5 random books
            const totalBooks = yield prisma_1.default.books.count();
            const randomBooks = yield prisma_1.default.books.findMany({
                take: 5,
                // Using skip with a random number to get random books
                skip: Math.max(0, Math.floor(Math.random() * totalBooks) - 5),
                include: {
                    author_books: {
                        include: {
                            authors: {
                                select: {
                                    name: true
                                }
                            }
                        }
                    },
                    category_books: {
                        include: {
                            categories: {
                                select: {
                                    name: true
                                }
                            }
                        }
                    },
                    book_copies: {
                        select: {
                            isAvailable: true
                        }
                    }
                }
            });
            // Format the response
            const formattedBooks = randomBooks.map(book => ({
                id: book.id,
                title: book.title,
                subtitle: book.subtitle,
                isbn: book.isbn,
                publicationYear: book.publicationYear,
                publisher: book.publisher,
                description: book.description,
                pageCount: book.pageCount,
                language: book.language,
                coverImage: book.coverImage,
                status: book.status,
                authors: book.author_books.map(ab => ab.authors.name),
                categories: book.category_books.map(cb => cb.categories.name),
                availableCopies: book.book_copies.filter(copy => copy.isAvailable).length,
                totalCopies: book.book_copies.length
            }));
            res.status(200).json({
                success: true,
                message: "Random books retrieved successfully",
                data: formattedBooks
            });
            return;
        }
        // Normalize search term
        const searchTerm = searchQuery.trim();
        // Search books by title, subtitle, author name, or ISBN
        const searchResults = yield prisma_1.default.books.findMany({
            where: {
                OR: [
                    { title: { contains: searchTerm, mode: 'insensitive' } },
                    { subtitle: { contains: searchTerm, mode: 'insensitive' } },
                    { isbn: { contains: searchTerm } },
                    { description: { contains: searchTerm, mode: 'insensitive' } },
                    { publisher: { contains: searchTerm, mode: 'insensitive' } },
                    {
                        author_books: {
                            some: {
                                authors: {
                                    name: { contains: searchTerm, mode: 'insensitive' }
                                }
                            }
                        }
                    },
                    {
                        category_books: {
                            some: {
                                categories: {
                                    name: { contains: searchTerm, mode: 'insensitive' }
                                }
                            }
                        }
                    }
                ]
            },
            include: {
                author_books: {
                    include: {
                        authors: {
                            select: {
                                name: true
                            }
                        }
                    }
                },
                category_books: {
                    include: {
                        categories: {
                            select: {
                                name: true
                            }
                        }
                    }
                },
                book_copies: {
                    select: {
                        isAvailable: true
                    }
                }
            }
        });
        // Format the response
        const formattedResults = searchResults.map(book => ({
            id: book.id,
            title: book.title,
            subtitle: book.subtitle,
            isbn: book.isbn,
            publicationYear: book.publicationYear,
            publisher: book.publisher,
            description: book.description,
            pageCount: book.pageCount,
            language: book.language,
            coverImage: book.coverImage,
            status: book.status,
            authors: book.author_books.map(ab => ab.authors.name),
            categories: book.category_books.map(cb => cb.categories.name),
            availableCopies: book.book_copies.filter(copy => copy.isAvailable).length,
            totalCopies: book.book_copies.length
        }));
        res.status(200).json({
            success: true,
            message: "Search completed successfully",
            data: formattedResults
        });
    }
    catch (error) {
        console.error('Search error:', error);
        res.status(500).json({
            error: true,
            message: "Failed to perform search",
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
});
router.get("/", GetBooks);
exports.default = router;
