import express, { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { authenticateToken } from '../auth/authentication';

const router = express.Router();

// Define interface for request with user
interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
  };
}

// Admin role check middleware
function adminRoleCheck(req: Request, res: Response, next: NextFunction) {
  // Type assertion since we know authenticateToken middleware adds user property
  const authReq = req as AuthenticatedRequest;
  
  prisma.users.findUnique({
    where: { id: authReq.user.userId },
    select: { role: true }
  })
  .then(user => {
    if (!user || user.role !== 'ADMIN') {
      res.status(403).json({ error: "Access denied. Admin privileges required." });
    } else {
      next();
    }
  })
  .catch(error => {
    console.error("Error verifying admin role:", error);
    res.status(500).json({ error: "Internal server error" });
  });
}


router.use(adminRoleCheck);

router.get('/', async (req: Request, res: Response) => {
  try {
    // Get total books count
    const totalBooks = await prisma.books.count();
    
    // Get active members count (students and librarians who are active)
    const activeMembers = await prisma.users.count({
      where: {
        isActive: true,
        role: {
          in: ['STUDENT', 'LIBRARIAN']
        }
      }
    });
    
    // Get books currently issued (transactions without return date)
    const booksIssued = await prisma.book_transactions.count({
      where: {
        transactionType: 'BORROW',
        returnDate: null
      }
    });
    
    // Get overdue books count
    const overdueBooks = await prisma.book_transactions.count({
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
    
  } catch (error) {
    console.error("Error fetching overview statistics:", error);
    res.status(500).json({ error: "Failed to retrieve overview statistics" });
  }
});

export default router;
