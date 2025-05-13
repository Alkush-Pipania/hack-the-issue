import { RequestHandler, Router } from "express";
import { z } from "zod";
import prisma from "../lib/prisma";
import { BookStatus } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import { CreateLinkService } from "../services/service.addBook";

const router = Router();

// Define validation schema for adding books
const addBookSchema = z.object({
 title : z.string(),
 subtitle : z.string(),
 isbn : z.string(),
 publicationYear : z.number(),
 publisher : z.string(),
 description : z.string(),
 pageCount : z.number(),
 language : z.string(),
 status : z.string(),
 authorName : z.string().or(z.array(z.string())), 
 content : z.string()// Accept single author or array of authors
});

const addBook: RequestHandler = async (req, res) => {
  const input = addBookSchema.safeParse(req.body);
  if (!input.success) {
    res.status(400).json({ message: "Invalid input", errors: input.error.errors });
    return;
  }

  const { title, subtitle, isbn, publicationYear, publisher, description, pageCount, language, status, authorName, content } = input.data;

  try {
    // Check if book with this ISBN already exists
    const existingBook = await prisma.books.findUnique({
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
    const newBook = await prisma.books.create({
      data: {
        title,
        subtitle,
        isbn,
        publicationYear,
        publisher,
        description,
        pageCount,
        language,
        status: status as BookStatus,
        id: uuidv4(),
        updatedAt: new Date(),
      },
      select:{
        id: true
      }
    });

    // Handle author connection
    if (authorName) {
      const authors = Array.isArray(authorName) ? authorName : [authorName];
      
      // For each author name, find or create the author and connect to the book
      for (const name of authors) {
        // Find or create author
        let author = await prisma.authors.findFirst({
          where: { name }
        });
        
        if (!author) {
          author = await prisma.authors.create({
            data: {
              id: uuidv4(),
              name
            }
          });
        }
        
        // Connect author to book
        await prisma.author_books.create({
          data: {
            bookId: newBook.id,
            authorId: author.id
          }
        });
      }
    }
    // Initialize vector database service
    const createLinkService = new CreateLinkService({
      GOOGLE_API_KEY: process.env.GOOGLE_API_KEY!,
      PINECONE_API_KEY: process.env.PINECONE_API_KEY!,
      PINECONE_INDEX: process.env.PINECONE_INDEX!,
    });
    
    // Add book content to vector database
    try {
      // Convert author array to string for metadata
      const authorNameString = Array.isArray(authorName) ? authorName.join(", ") : authorName;
      
      // Store book content in vector database
      await createLinkService.createLink({
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
    } catch (vectorError) {
      console.error("Error adding book to vector database:", vectorError);
      // Book is already created in database, so return partial success
      res.status(201).json({
        message: "Book created successfully, but failed to index content",
        book: newBook
      });
    }

  } catch (error) {
    console.error("Error creating book:", error);
    res.status(500).json({
      message: "Failed to create book",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

router.post("/", addBook);

export default router;