"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";
import { TransactionType, BookStatus, ReservationStatus } from "@prisma/client";
import { randomUUID } from "crypto";

const issueBookSchema = z.object({
  userId: z.string(),
  bookId: z.string(),
  copyId: z.string().optional(),
  dueDate: z.string().optional(),
  notes: z.string().optional()
});

type IssueBookInput = z.infer<typeof issueBookSchema>;

export async function issueBook(input: IssueBookInput) {
  const validatedData = issueBookSchema.safeParse(input);
  
  if (!validatedData.success) {
    return { success: false, message: "Invalid input data", errors: validatedData.error.errors };
  }
  
  const { userId, bookId, copyId, dueDate, notes } = validatedData.data;
  
  try {
    const mockUsers = [
      { id: 'user1', name: 'John Doe', email: 'john@example.com', role: 'STUDENT' },
      { id: 'user2', name: 'Jane Smith', email: 'jane@example.com', role: 'STUDENT' },
      { id: 'user3', name: 'Alex Jones', email: 'alex@example.com', role: 'LIBRARIAN' },
    ];

    const user = mockUsers.find(u => u.id === userId);
    if (!user) {
      return { success: false, message: "User not found" };
    }

    const mockBooks = [
      { 
        id: '1', 
        title: 'The Great Gatsby', 
        isbn: '9780743273565',
        authors: ['F. Scott Fitzgerald'],
        totalCopies: 5,
        availableCopies: 3,
        copies: [
          { id: 'copy1', condition: 'Good', isAvailable: true },
          { id: 'copy2', condition: 'Excellent', isAvailable: true },
          { id: 'copy3', condition: 'Fair', isAvailable: true }
        ] 
      },
      { 
        id: '2', 
        title: 'To Kill a Mockingbird', 
        isbn: '9780061120084',
        authors: ['Harper Lee'],
        totalCopies: 3,
        availableCopies: 2,
        copies: [
          { id: 'copy4', condition: 'Good', isAvailable: true },
          { id: 'copy5', condition: 'Excellent', isAvailable: true }
        ] 
      },
      { 
        id: '3', 
        title: '1984', 
        isbn: '9780451524935',
        authors: ['George Orwell'],
        totalCopies: 4,
        availableCopies: 4,
        copies: [
          { id: 'copy6', condition: 'New', isAvailable: true },
          { id: 'copy7', condition: 'Good', isAvailable: true },
          { id: 'copy8', condition: 'Excellent', isAvailable: true },
          { id: 'copy9', condition: 'Good', isAvailable: true }
        ] 
      }
    ];

    const book = mockBooks.find(b => b.id === bookId);
    if (!book) {
      return { success: false, message: "Book not found" };
    }

    let selectedCopy;
    if (copyId) {
      for (const mockBook of mockBooks) {
        const copy = mockBook.copies.find(c => c.id === copyId);
        if (copy) {
          selectedCopy = copy;
          break;
        }
      }

      if (!selectedCopy) {
        return { success: false, message: "Book copy not found" };
      }

      if (!selectedCopy.isAvailable) {
        return { success: false, message: "The selected book copy is already borrowed" };
      }
    } else {
      selectedCopy = book.copies.find(c => c.isAvailable);
      if (!selectedCopy) {
        return { success: false, message: "No available copies of this book" };
      }
    }

    const borrowDate = new Date();
    let calculatedDueDate;

    if (dueDate) {
      calculatedDueDate = new Date(dueDate);
    } else {
      calculatedDueDate = new Date(borrowDate);
      calculatedDueDate.setDate(calculatedDueDate.getDate() + 14);
    }

    const transactionId = randomUUID();

    return {
      success: true,
      message: "Book issued successfully",
      data: {
        transactionId: transactionId,
        bookTitle: book.title,
        borrowDate: borrowDate,
        dueDate: calculatedDueDate
      }
    };

  } catch (error) {
    console.error("Error issuing book:", error);
    return { success: false, message: "Failed to issue book. Please try again." };
  }
}

export async function getUsers() {
  try {
    const mockUsers = [
      { id: 'user1', name: 'John Doe', email: 'john@example.com', role: 'STUDENT' },
      { id: 'user2', name: 'Jane Smith', email: 'jane@example.com', role: 'STUDENT' },
      { id: 'user3', name: 'Alex Jones', email: 'alex@example.com', role: 'LIBRARIAN' },
    ];
    
    return {
      success: true,
      data: mockUsers,
      message: "Users fetched successfully"
    };
  } catch (error) {
    console.error("Error fetching users:", error);
    return { success: false, message: "Failed to fetch users" };
  }
}

export async function getBooks(searchQuery?: string) {
  try {
    const mockBooks = [
      { 
        id: '1', 
        title: 'The Great Gatsby', 
        isbn: '9780743273565',
        authors: ['F. Scott Fitzgerald'],
        totalCopies: 5,
        availableCopies: 3,
        copies: [
          { id: 'copy1', condition: 'Good', isAvailable: true },
          { id: 'copy2', condition: 'Excellent', isAvailable: true },
          { id: 'copy3', condition: 'Fair', isAvailable: true }
        ] 
      },
      { 
        id: '2', 
        title: 'To Kill a Mockingbird', 
        isbn: '9780061120084',
        authors: ['Harper Lee'],
        totalCopies: 3,
        availableCopies: 2,
        copies: [
          { id: 'copy4', condition: 'Good', isAvailable: true },
          { id: 'copy5', condition: 'Excellent', isAvailable: true }
        ] 
      },
      { 
        id: '3', 
        title: '1984', 
        isbn: '9780451524935',
        authors: ['George Orwell'],
        totalCopies: 4,
        availableCopies: 4,
        copies: [
          { id: 'copy6', condition: 'New', isAvailable: true },
          { id: 'copy7', condition: 'Good', isAvailable: true },
          { id: 'copy8', condition: 'Excellent', isAvailable: true },
          { id: 'copy9', condition: 'Good', isAvailable: true }
        ] 
      }
    ];

    // If there's a search query, filter the mock data
    const filteredBooks = searchQuery 
      ? mockBooks.filter(book => 
          book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          book.isbn.includes(searchQuery) ||
          book.authors.some(author => author.toLowerCase().includes(searchQuery.toLowerCase()))
        )
      : mockBooks;
    
    return {
      success: true,
      data: filteredBooks,
      message: "Books fetched successfully"
    };
  } catch (error) {
    console.error("Error fetching books:", error);
    return { success: false, message: "Failed to fetch books" };
  }
}