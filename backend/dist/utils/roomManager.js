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
exports.RoomManager = void 0;
const __1 = require("..");
const types_1 = require("../types");
class RoomManager {
    constructor(roomId, adminId) {
        this.roomId = roomId;
        this.adminId = adminId;
        this.members = new Map();
        this.muted = new Set();
    }
    addMember(user, ws) {
        return __awaiter(this, void 0, void 0, function* () {
            this.members.set(user.id, ws);
            const payload = JSON.stringify({
                type: types_1.MEMBERS_UPDATE,
                data: user,
            });
            for (const [, memberWs] of this.members) {
                if (memberWs == ws)
                    continue;
                memberWs.send(payload);
            }
        });
    }
    removeMember(user) {
        return __awaiter(this, void 0, void 0, function* () {
            // First, find the member by userId and roomId to get the unique id
            const memberRecord = yield __1.prisma.member.findFirst({
                where: {
                    userId: user.id,
                    roomId: this.roomId,
                }
            });
            if (!memberRecord)
                return;
            const member = yield __1.prisma.member.update({
                where: {
                    id: memberRecord.id,
                },
                data: {
                    online: false,
                }
            });
            console.log("Member removed:", member);
            const payload = JSON.stringify({
                type: types_1.REMOVED,
                data: {
                    user
                },
            });
            for (const [, memberWs] of this.members) {
                // if(memberWs == this.members.get(user.id)) continue;
                memberWs.send(payload);
            }
            this.members.delete(user.id);
            this.muted.delete(user.id);
        });
    }
    muteMember(userId) {
        this.muted.add(userId);
    }
    unmuteMember(userId) {
        this.muted.delete(userId);
    }
    isAdmin(userId) {
        return userId === this.adminId;
    }
    isMuted(userId) {
        return this.muted.has(userId);
    }
    restoreChats() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield __1.prisma.chat.findMany({
                where: {
                    roomId: this.roomId,
                    isDeleted: false,
                },
                orderBy: {
                    createdAt: 'asc',
                },
            });
        });
    }
    handleMessage(sender, message) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("I am here in the room manager sending messages");
            if (this.isMuted(sender.id))
                return;
            const member = yield __1.prisma.member.findFirst({
                where: {
                    userId: sender.id,
                    roomId: this.roomId,
                },
            });
            console.log("It's not done yet");
            if (!member)
                return;
            const chat = yield __1.prisma.chat.create({
                data: {
                    message,
                    roomId: this.roomId,
                    MemberId: member.id,
                },
            });
            console.log("It's not done yet");
            const payload = JSON.stringify({
                type: types_1.NEW_MESSAGE,
                data: {
                    id: chat === null || chat === void 0 ? void 0 : chat.id,
                    user: sender,
                    type: 'text',
                    message: chat === null || chat === void 0 ? void 0 : chat.message,
                    createdAt: chat === null || chat === void 0 ? void 0 : chat.createdAt,
                },
            });
            console.log("It's done now");
            for (const [, memberWs] of this.members) {
                memberWs.send(payload);
            }
        });
    }
    deleteMessage(chatId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const chat = yield __1.prisma.chat.findUnique({
                    where: { id: chatId },
                    include: { Member: true },
                });
                console.log("Chat found:", chat, "UserId is", userId);
                if (!chat)
                    throw new Error("Message not found");
                if (userId !== (chat === null || chat === void 0 ? void 0 : chat.Member.userId) && userId !== this.adminId)
                    throw new Error("You are not authorized to delete this message");
                const deletedChat = yield __1.prisma.chat.update({
                    where: { id: chatId },
                    data: {
                        isDeleted: true,
                    }
                });
                if (!deletedChat)
                    throw new Error("Message not found or already deleted");
                const payload = JSON.stringify({
                    type: types_1.DELETE_MESSAGE,
                    data: {
                        messageId: chatId
                    },
                });
                for (const [, memberWs] of this.members) {
                    memberWs.send(payload);
                }
                console.log("Message deleted successfully:", deletedChat);
            }
            catch (error) {
                console.error("Error deleting message:", error);
            }
        });
    }
    endRoom() {
        return __awaiter(this, void 0, void 0, function* () {
            yield __1.prisma.room.update({
                where: { id: this.roomId },
                data: { isActive: false },
            });
            for (const [, ws] of this.members) {
                ws.send(JSON.stringify({ type: 'ROOM_CLOSED' }));
                ws.close();
            }
            this.members.clear();
            this.muted.clear();
        });
    }
}
exports.RoomManager = RoomManager;
