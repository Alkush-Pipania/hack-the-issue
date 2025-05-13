import { RequestHandler, Router } from "express";
import { z } from "zod";
import prisma from "../lib/prisma";
import { TransactionType, BookStatus } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

const router = Router();

// Define validation schema for issuing books
const issueBookSchema = z.object({
  userId: z.string(),
  bookId: z.string(),
  copyId: z.string().optional(), // Optional: if null, we'll find an available copy
  dueDate: z.string().optional(), // Optional: default due date will be calculated if not provided
  notes: z.string().optional()
});

/**
 * Issue a book to a user
 * Creates a book transaction record and marks the book copy as unavailable
 */
const issueBook: RequestHandler = async (req, res) => {
  const input = issueBookSchema.safeParse(req.body);
  if (!input.success) {
    res.status(400).json({ message: "Invalid input", errors: input.error.errors });
    return;
  }

  const { userId, bookId, copyId, dueDate, notes } = input.data;

  try {
    // Verify user exists
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { id: true, role: true }
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Verify book exists
    const book = await prisma.books.findUnique({
      where: { id: bookId },
      select: { id: true, title: true, status: true }
    });

    if (!book) {
      res.status(404).json({ message: "Book not found" });
      return;
    }

    // Check if the book can be borrowed (not under maintenance or lost)
    if (book.status === BookStatus.UNDER_MAINTENANCE || book.status === BookStatus.LOST) {
      res.status(400).json({ 
        message: `Book cannot be borrowed: ${book.status}` 
      });
      return;
    }

    // Get a specific copy or find an available one
    let bookCopy;
    if (copyId) {
      // Get the specified copy
      bookCopy = await prisma.book_copies.findUnique({
        where: { id: copyId },
        select: { id: true, bookId: true, isAvailable: true, condition: true }
      });

      if (!bookCopy) {
        res.status(404).json({ message: "Book copy not found" });
        return;
      }

      if (!bookCopy.isAvailable) {
        res.status(400).json({ message: "The selected book copy is already borrowed" });
        return;
      }

      if (bookCopy.bookId !== bookId) {
        res.status(400).json({ message: "The selected copy does not match the requested book" });
        return;
      }
    } else {
      // Find an available copy
      bookCopy = await prisma.book_copies.findFirst({
        where: {
          bookId: bookId,
          isAvailable: true
        },
        select: { id: true, bookId: true, isAvailable: true, condition: true }
      });

      if (!bookCopy) {
        res.status(404).json({ message: "No available copies of this book" });
        return;
      }
    }

    // Calculate due date (default to 14 days from now if not provided)
    const borrowDate = new Date();
    let dueDateObj: Date;
    
    if (dueDate) {
      dueDateObj = new Date(dueDate);
    } else {
      dueDateObj = new Date();
      dueDateObj.setDate(dueDateObj.getDate() + 14); // 14 days loan period by default
    }

    // Create transaction with Prisma transaction to ensure consistency
    const result = await prisma.$transaction(async (tx) => {
      // Create the book transaction
      const transaction = await tx.book_transactions.create({
        data: {
          id: uuidv4(),
          userId,
          bookId,
          copyId: bookCopy.id,
          transactionType: TransactionType.BORROW,
          borrowDate,
          dueDate: dueDateObj,
          renewalCount: 0,
          notes: notes || null
        }
      });

      // Update book copy status
      await tx.book_copies.update({
        where: { id: bookCopy.id },
        data: { isAvailable: false }
      });

      // Check if all copies are now borrowed and update book status
      const availableCopiesCount = await tx.book_copies.count({
        where: {
          bookId,
          isAvailable: true
        }
      });

      if (availableCopiesCount === 0) {
        await tx.books.update({
          where: { id: bookId },
          data: { status: BookStatus.ON_LOAN }
        });
      }

      // Create a notification for the user
      await tx.notifications.create({
        data: {
          id: uuidv4(),
          userId,
          type: "DUE_DATE_REMINDER",
          title: "Book Borrowed Successfully",
          message: `You have borrowed '${book.title}'. It is due back by ${dueDateObj.toLocaleDateString()}.`,
          isRead: false
        }
      });

      return transaction;
    });

    // Return success response
    res.status(201).json({
      message: "Book issued successfully",
      transaction: {
        id: result.id,
        borrowDate: result.borrowDate,
        dueDate: result.dueDate
      }
    });

  } catch (error) {
    console.error("Error issuing book:", error);
    res.status(500).json({
      message: "Failed to issue book",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

router.post("/", issueBook);

export default router;