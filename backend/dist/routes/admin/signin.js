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
const prisma_1 = __importDefault(require("../../lib/prisma"));
const zod_1 = require("../../types/zod");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const router = (0, express_1.Router)();
const signIn = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const input = zod_1.signInSchema.safeParse(req.body);
    if (!input.success) {
        res.status(400).json("Invalid Request");
        return;
    }
    const { email, password } = input.data;
    try {
        const user = yield prisma_1.default.users.findUnique({
            where: {
                email,
            },
            select: {
                email: true,
                role: true,
                passwordHash: true,
                id: true,
            }
        });
        if (!user) {
            res.status(404).json("User Not Found");
            return;
        }
        const isMatch = yield bcrypt_1.default.compare(password, user === null || user === void 0 ? void 0 : user.passwordHash);
        if (!isMatch) {
            res.status(401).json("Invalid Credentials");
            return;
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, process.env.JWT_SECRET);
        res.json({ token, email });
        return;
    }
    catch (error) {
        res.status(500).json("Internal Server Error");
        return;
    }
});
router.post('/', signIn);
exports.default = router;
