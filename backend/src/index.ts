import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authenticateToken } from './auth/authentication';
import { default as signin } from './routes/admin/signin'
import { default as addStaff } from './routes/admin/addStaff'
import { default as addBook } from './routes/addBooks'
import { default as issueBook} from './routes/IssueBook' 
import { default as chat} from './routes/chat'
import { default as userDetails} from './routes/userdetails'
import { default as overview} from './routes/overview'
import { default as searchBooks} from './routes/SearchBooks'


dotenv.config();

const app = express();
const port = process.env.PORT

app.use(express.json());
app.use(cors({
  origin: ['http://localhost:3000', 'https://www.carter.fun/', 'https://carter.fun/'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'X-Kuma-Revision'],
  maxAge: 600,
  credentials: true,
  preflightContinue: false
}));

app.use('/api/signin', signin);
// app.use(authenticateToken as RequestHandler);
app.use('/api/addstaff' ,addStaff)
app.use('/api/addbook' ,addBook)
app.use('/api/issuebook' ,issueBook)
app.use('/api/chat' , chat)
app.use('/api/userdetails' , userDetails)
app.use('/api/overview' , overview)
app.use('/api/books/search' , searchBooks)

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});


