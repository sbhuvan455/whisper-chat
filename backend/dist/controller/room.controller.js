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
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRoom = void 0;
const express_1 = require("@clerk/express");
const __1 = require("..");
const createRoom = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { title, description } = req.body;
    if (!title || !description) {
        return res.status(400).json({ error: 'title and description are required' });
    }
    const { userId } = (0, express_1.getAuth)(req);
    if (!userId)
        return res.status(401).json({ error: 'Unauthorized' });
    const user = yield express_1.clerkClient.users.getUser(userId);
    if (!user)
        return res.status(401).json({ error: 'Unauthorized, Incorrect user id' });
    try {
        const room = yield __1.prisma.room.create({
            data: {
                title,
                description,
                adminId: userId,
            },
        });
        return res.status(201).json({
            success: true,
            message: 'Room created successfully',
            data: room,
        });
    }
    catch (error) {
        console.error('Error creating room:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
exports.createRoom = createRoom;
