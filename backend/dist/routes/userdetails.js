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
const prisma_1 = __importDefault(require("../lib/prisma"));
const zod_1 = require("zod");
const router = (0, express_1.Router)();
const userDetailsSchema = zod_1.z.object({
    userId: zod_1.z.string()
});
const getUserDetails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const input = userDetailsSchema.safeParse(req.query);
    if (!input.success) {
        res.status(400).json("Invalid Request");
        return;
    }
    const { userId } = input.data;
    try {
        const user = yield prisma_1.default.users.findUnique({
            where: {
                id: userId,
            }
        });
        if (!user) {
            res.status(404).json("User Not Found");
            return;
        }
        res.json(user);
    }
    catch (error) {
        res.status(500).json("Internal Server Error");
    }
});
router.get('/', getUserDetails);
exports.default = router;
