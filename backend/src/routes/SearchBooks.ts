import { Router, RequestHandler } from "express";
import prisma from "../lib/prisma";
import { z } from "zod";

const router = Router();

const SearchBooksSchema = z.object({
    userId : z.string(),
    searchQuery : z.string().optional(),
})


const GetBooks : RequestHandler = async(req , res) =>{
    const input = SearchBooksSchema.safeParse(req.query);
    if(!input.success){
        res.status(400).json("Invalid Request");
        return;
    }

    try{
        const { userId, searchQuery } = input.data;
        
        // If search is empty, return 5 random books
        if (!searchQuery || searchQuery.trim() === '') {
            // Get 5 random books
            const totalBooks = await prisma.books.count();
            const randomBooks = await prisma.books.findMany({
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
        const searchResults = await prisma.books.findMany({
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
    } catch(error) {
        console.error('Search error:', error);
        res.status(500).json({
            error: true,
            message: "Failed to perform search",
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
}

router.get("/", GetBooks);

export default router;