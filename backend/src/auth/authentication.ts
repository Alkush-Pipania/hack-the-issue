import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface JwtPayload {
  userId: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  console.log('All Headers:', req.headers);
  console.log('Authorization Header:', req.headers['authorization']);
  
  const authHeader = req.headers['authorization'] as string | undefined;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('Auth Header Check Failed:', { authHeader, hasBearer: authHeader?.startsWith('Bearer ') });
    return res.status(401).json({ error: 'Access token is required' });
  }

  const token = authHeader.split(' ')[1];
  console.log('Extracted Token:', token);

  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not defined in environment variables');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;
    req.user = decoded;

    // Check if userId in request matches token userId
    const requestUserId = req.body.userId || req.query.userId;
    if (requestUserId && requestUserId !== decoded.userId) {
      return res.status(403).json({ error: 'User ID mismatch' });
    }

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Token has expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}; 