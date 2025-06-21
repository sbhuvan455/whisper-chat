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
exports.getAllMembers = exports.getAdminId = exports.createRoom = void 0;
const __1 = require("..");
const createRoom = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Creating room with data:', req.body);
    const { title, description } = req.body;
    if (!title || !description) {
        return res.status(400).json({ error: 'title and description are required' });
    }
    const { user } = req.body;
    if (!user)
        return res.status(401).json({ error: 'Unauthorized' });
    try {
        const room = yield __1.prisma.room.create({
            data: {
                title,
                description,
                adminId: user.id,
            },
        });
        return res.status(201).json({
            success: true,
            message: 'Room created successfully',
            data: room,
        });
    }
    catch (error) {
        // console.error('Error creating room:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
exports.createRoom = createRoom;
const getAdminId = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { roomId } = req.body;
    if (!roomId) {
        return res.status(400).json({ error: 'Missing roomId parameter' });
    }
    try {
        const room = yield __1.prisma.room.findUnique({
            where: { id: roomId },
            select: { adminId: true },
        });
        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }
        return res.status(200).json({ adminId: room.adminId });
    }
    catch (error) {
        console.error('Error fetching adminId:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});
exports.getAdminId = getAdminId;
const getAllMembers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { roomId } = req.body;
    if (!roomId) {
        return res.status(400).json({ error: 'Missing roomId parameter' });
    }
    try {
        const members = yield __1.prisma.member.findMany({
            where: { roomId, online: true },
        });
        return res.status(200).json({ members });
    }
    catch (error) {
        console.error('Error fetching members:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});
exports.getAllMembers = getAllMembers;
