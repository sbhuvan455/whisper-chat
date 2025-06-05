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
exports.acceptUser = exports.createNewMember = exports.createRoom = void 0;
// import { clerkClient, getAuth, User } from '@clerk/express'
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
const createNewMember = (userId, roomId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!userId)
            throw new Error("User Id Not Found");
        // const { id, adminId } = data;
        // if(!id || !adminId) throw new Error("Room Id or Admin Id Not Found");
        const room = yield __1.prisma.room.findUnique({
            where: {
                id: roomId
            }
        });
        if (!room)
            throw new Error("Room Not Found");
        if (userId == room.adminId) {
            const Member = yield __1.prisma.member.findFirst({
                where: {
                    roomId,
                    userId
                }
            });
            if (!Member) {
                const newMember = yield __1.prisma.member.create({
                    data: {
                        roomId,
                        userId
                    }
                });
                if (!newMember)
                    throw new Error("Error creating member");
            }
            return { success: true, isAdmin: true, message: "the User is the admin of the room" };
        }
        return { success: true, isAdmin: false, message: "the User is not the admin of the room" };
    }
    catch (error) {
        console.log('Error joining room:', error);
        return { success: false, error: error.message };
    }
});
exports.createNewMember = createNewMember;
const acceptUser = (roomId, user) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = JSON.parse(user.toString());
        if (!userId)
            throw new Error("User Id Not Found");
        const room = yield __1.prisma.room.findUnique({
            where: {
                id: roomId
            }
        });
        if (!room)
            throw new Error("Room Not Found");
        const Member = yield __1.prisma.member.findFirst({
            where: {
                roomId,
                userId
            }
        });
        if (Member)
            return { success: true, message: "User already a member of the room", data: Member };
        const newMember = yield __1.prisma.member.create({
            data: {
                roomId,
                userId
            }
        });
        if (!newMember)
            throw new Error("Error accepting member");
        return { success: true, message: "User accepted successfully", data: newMember };
    }
    catch (error) {
        console.log('Error accepting user:', error);
        return { success: false, error: error.message };
    }
});
exports.acceptUser = acceptUser;
