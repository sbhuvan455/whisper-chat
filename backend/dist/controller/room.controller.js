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
exports.acceptUser = exports.createNewMember = exports.initializeActiveRooms = void 0;
// import { clerkClient, getAuth, User } from '@clerk/express'
const __1 = require("..");
const initializeActiveRooms = (chatManager) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const activeRooms = yield __1.prisma.room.findMany({
            where: {
                isActive: true
            },
            select: {
                id: true,
                adminId: true
            }
        });
        if (!activeRooms.length) {
            // No active rooms found, clear the map
            chatManager.clearRooms();
            console.log('No active rooms found. Cleared ChatManager rooms.');
            return;
        }
        // Populate the rooms map
        activeRooms.forEach(room => {
            chatManager.initRooms(room.id, room.adminId);
        });
        console.log(`Initialized ${activeRooms.length} active rooms.`);
    }
    catch (error) {
        console.error('Error initializing active rooms:', error);
    }
});
exports.initializeActiveRooms = initializeActiveRooms;
const createNewMember = (user, roomId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = user === null || user === void 0 ? void 0 : user.id;
        const image_url = (user === null || user === void 0 ? void 0 : user.imageUrl) || null;
        const fullName = user === null || user === void 0 ? void 0 : user.fullName;
        if (!userId || !fullName)
            throw new Error("User Id or Full Name Not Found");
        if (!userId)
            throw new Error("User Id Not Found");
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
                        userId,
                        image_url,
                        fullName,
                    }
                });
                if (!newMember)
                    throw new Error("Error creating member");
            }
            else {
                yield __1.prisma.member.update({
                    where: {
                        id: Member.id
                    },
                    data: {
                        online: true,
                    }
                });
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
const acceptUser = (user, roomId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = user === null || user === void 0 ? void 0 : user.id;
        const fullName = user === null || user === void 0 ? void 0 : user.fullName;
        console.log("in accept user", user);
        const image_url = (user === null || user === void 0 ? void 0 : user.imageUrl) || null;
        if (!userId || !fullName)
            throw new Error("User Id or fullname Not Found");
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
        if (Member) {
            yield __1.prisma.member.update({
                where: {
                    id: Member.id
                },
                data: {
                    online: true,
                }
            });
            return { success: true, message: "User already a member of the room", data: Member };
        }
        const newMember = yield __1.prisma.member.create({
            data: {
                roomId,
                userId,
                image_url,
                fullName,
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
