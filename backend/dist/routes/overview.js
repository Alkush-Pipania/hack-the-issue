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
const express_1 = __importDefault(require("express"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const router = express_1.default.Router();
// Admin role check middleware
function adminRoleCheck(req, res, next) {
    // Type assertion since we know authenticateToken middleware adds user property
    const authReq = req;
    prisma_1.default.users.findUnique({
        where: { id: authReq.user.userId },
        select: { role: true }
    })
        .then(user => {
        if (!user || user.role !== 'ADMIN') {
            res.status(403).json({ error: "Access denied. Admin privileges required." });
        }
        else {
            next();
        }
    })
        .catch(error => {
        console.error("Error verifying admin role:", error);
        res.status(500).json({ error: "Internal server error" });
    });
}
router.use(adminRoleCheck);
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Get total books count
        const totalBooks = yield prisma_1.default.books.count();
        // Get active members count (students and librarians who are active)
        const activeMembers = yield prisma_1.default.users.count({
            where: {
                isActive: true,
                role: {
                    in: ['STUDENT', 'LIBRARIAN']
                }
            }
        });
        // Get books currently issued (transactions without return date)
        const booksIssued = yield prisma_1.default.book_transactions.count({
            where: {
                transactionType: 'BORROW',
                returnDate: null
            }
        });
        // Get overdue books count
        const overdueBooks = yield prisma_1.default.book_transactions.count({
            where: {
                transactionType: 'BORROW',
                returnDate: null,
                dueDate: {
                    lt: new Date() // Due date is less than current date
                }
            }
        });
        // Return all stats in a single response
        res.status(200).json({
            totalBooks,
            activeMembers,
            booksIssued,
            overdueBooks
        });
    }
    catch (error) {
        console.error("Error fetching overview statistics:", error);
        res.status(500).json({ error: "Failed to retrieve overview statistics" });
    }
}));
exports.default = router;
