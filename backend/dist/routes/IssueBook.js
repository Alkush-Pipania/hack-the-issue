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
const client_1 = require("@prisma/client");
const uuid_1 = require("uuid");
const router = (0, express_1.Router)();
// Define validation schema for issuing books
const issueBookSchema = zod_1.z.object({
    userId: zod_1.z.string(),
    bookId: zod_1.z.string(),
    copyId: zod_1.z.string().optional(), // Optional: if null, we'll find an available copy
    dueDate: zod_1.z.string().optional(), // Optional: default due date will be calculated if not provided
    notes: zod_1.z.string().optional()
});
/**
 * Issue a book to a user
 * Creates a book transaction record and marks the book copy as unavailable
 */
const issueBook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const input = issueBookSchema.safeParse(req.body);
    if (!input.success) {
        res.status(400).json({ message: "Invalid input", errors: input.error.errors });
        return;
    }
    const { userId, bookId, copyId, dueDate, notes } = input.data;
    try {
        // Verify user exists
        const user = yield prisma_1.default.users.findUnique({
            where: { id: userId },
            select: { id: true, role: true }
        });
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        // Verify book exists
        const book = yield prisma_1.default.books.findUnique({
            where: { id: bookId },
            select: { id: true, title: true, status: true }
        });
        if (!book) {
            res.status(404).json({ message: "Book not found" });
            return;
        }
        // Check if the book can be borrowed (not under maintenance or lost)
        if (book.status === client_1.BookStatus.UNDER_MAINTENANCE || book.status === client_1.BookStatus.LOST) {
            res.status(400).json({
                message: `Book cannot be borrowed: ${book.status}`
            });
            return;
        }
        // Get a specific copy or find an available one
        let bookCopy;
        if (copyId) {
            // Get the specified copy
            bookCopy = yield prisma_1.default.book_copies.findUnique({
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
        }
        else {
            // Find an available copy
            bookCopy = yield prisma_1.default.book_copies.findFirst({
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
        let dueDateObj;
        if (dueDate) {
            dueDateObj = new Date(dueDate);
        }
        else {
            dueDateObj = new Date();
            dueDateObj.setDate(dueDateObj.getDate() + 14); // 14 days loan period by default
        }
        // Create transaction with Prisma transaction to ensure consistency
        const result = yield prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            // Create the book transaction
            const transaction = yield tx.book_transactions.create({
                data: {
                    id: (0, uuid_1.v4)(),
                    userId,
                    bookId,
                    copyId: bookCopy.id,
                    transactionType: client_1.TransactionType.BORROW,
                    borrowDate,
                    dueDate: dueDateObj,
                    renewalCount: 0,
                    notes: notes || null
                }
            });
            // Update book copy status
            yield tx.book_copies.update({
                where: { id: bookCopy.id },
                data: { isAvailable: false }
            });
            // Check if all copies are now borrowed and update book status
            const availableCopiesCount = yield tx.book_copies.count({
                where: {
                    bookId,
                    isAvailable: true
                }
            });
            if (availableCopiesCount === 0) {
                yield tx.books.update({
                    where: { id: bookId },
                    data: { status: client_1.BookStatus.ON_LOAN }
                });
            }
            // Create a notification for the user
            yield tx.notifications.create({
                data: {
                    id: (0, uuid_1.v4)(),
                    userId,
                    type: "DUE_DATE_REMINDER",
                    title: "Book Borrowed Successfully",
                    message: `You have borrowed '${book.title}'. It is due back by ${dueDateObj.toLocaleDateString()}.`,
                    isRead: false
                }
            });
            return transaction;
        }));
        // Return success response
        res.status(201).json({
            message: "Book issued successfully",
            transaction: {
                id: result.id,
                borrowDate: result.borrowDate,
                dueDate: result.dueDate
            }
        });
    }
    catch (error) {
        console.error("Error issuing book:", error);
        res.status(500).json({
            message: "Failed to issue book",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
});
router.post("/", issueBook);
exports.default = router;
