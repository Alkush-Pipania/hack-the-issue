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
const zod_1 = require("zod");
const bcrypt_1 = __importDefault(require("bcrypt"));
const uuid_1 = require("uuid");
const router = (0, express_1.Router)();
// Define validation schema for adding staff
const addStaffSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
    firstName: zod_1.z.string().min(1),
    lastName: zod_1.z.string().min(1),
});
const addStaff = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const input = addStaffSchema.safeParse(req.body);
    if (!input.success) {
        res.status(400).json({ message: "Invalid input", errors: input.error.errors });
        return;
    }
    const { email, password, firstName, lastName } = input.data;
    try {
        // Check if user already exists
        const existingUser = yield prisma_1.default.users.findUnique({
            where: { email },
        });
        if (existingUser) {
            res.status(409).json({ message: "User with this email already exists" });
            return;
        }
        // Hash the password
        const salt = yield bcrypt_1.default.genSalt(10);
        const passwordHash = yield bcrypt_1.default.hash(password, salt);
        // Create new staff member (librarian)
        const newStaff = yield prisma_1.default.users.create({
            data: {
                id: (0, uuid_1.v4)(),
                email,
                passwordHash,
                firstName,
                lastName,
                role: "LIBRARIAN",
                updatedAt: new Date(),
                isActive: true,
            },
        });
        // Return success response without sensitive data
        res.status(201).json({
            message: "Staff member created successfully",
            staff: {
                id: newStaff.id,
                email: newStaff.email,
                firstName: newStaff.firstName,
                lastName: newStaff.lastName,
                role: newStaff.role,
            },
        });
    }
    catch (error) {
        console.error("Error creating staff member:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
router.post("/", addStaff);
exports.default = router;
