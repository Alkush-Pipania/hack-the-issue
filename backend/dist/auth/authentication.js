"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authenticateToken = (req, res, next) => {
    console.log('All Headers:', req.headers);
    console.log('Authorization Header:', req.headers['authorization']);
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('Auth Header Check Failed:', { authHeader, hasBearer: authHeader === null || authHeader === void 0 ? void 0 : authHeader.startsWith('Bearer ') });
        return res.status(401).json({ error: 'Access token is required' });
    }
    const token = authHeader.split(' ')[1];
    console.log('Extracted Token:', token);
    if (!process.env.JWT_SECRET) {
        console.error('JWT_SECRET is not defined in environment variables');
        return res.status(500).json({ error: 'Server configuration error' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        // Check if userId in request matches token userId
        const requestUserId = req.body.userId || req.query.userId;
        if (requestUserId && requestUserId !== decoded.userId) {
            return res.status(403).json({ error: 'User ID mismatch' });
        }
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            return res.status(401).json({ error: 'Token has expired' });
        }
        return res.status(401).json({ error: 'Invalid token' });
    }
};
exports.authenticateToken = authenticateToken;
