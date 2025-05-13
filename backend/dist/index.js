"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const signin_1 = __importDefault(require("./routes/admin/signin"));
const addStaff_1 = __importDefault(require("./routes/admin/addStaff"));
const addBooks_1 = __importDefault(require("./routes/addBooks"));
const IssueBook_1 = __importDefault(require("./routes/IssueBook"));
const chat_1 = __importDefault(require("./routes/chat"));
const userdetails_1 = __importDefault(require("./routes/userdetails"));
const overview_1 = __importDefault(require("./routes/overview"));
const SearchBooks_1 = __importDefault(require("./routes/SearchBooks"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT;
app.use(express_1.default.json());
app.use((0, cors_1.default)({
    origin: ['http://localhost:3000', 'https://www.carter.fun/', 'https://carter.fun/'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Length', 'X-Kuma-Revision'],
    maxAge: 600,
    credentials: true,
    preflightContinue: false
}));
app.use('/api/signin', signin_1.default);
// app.use(authenticateToken as RequestHandler);
app.use('/api/addstaff', addStaff_1.default);
app.use('/api/addbook', addBooks_1.default);
app.use('/api/issuebook', IssueBook_1.default);
app.use('/api/chat', chat_1.default);
app.use('/api/userdetails', userdetails_1.default);
app.use('/api/overview', overview_1.default);
app.use('/api/books/search', SearchBooks_1.default);
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
