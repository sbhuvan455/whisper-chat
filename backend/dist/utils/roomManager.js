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
        this.members.set(user.id, ws);
        const payload = JSON.stringify({
            type: types_1.MEMBERS_UPDATE,
            data: {
                user
            },
        });
        for (const [, memberWs] of this.members) {
            if (memberWs == ws)
                continue;
            memberWs.send(payload);
        }
        const members = __1.prisma.member.findMany({
            where: {
                roomId: this.roomId,
            }
        });
        ws.send(JSON.stringify({
            type: types_1.MEMBERS_UPDATE,
            data: members,
        }));
    }
    removeMember(user) {
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
            const chat = yield __1.prisma.chat.findUnique({
                where: { id: chatId },
            });
            if (userId !== (chat === null || chat === void 0 ? void 0 : chat.MemberId) || userId !== this.adminId)
                return;
            const deletedChat = yield __1.prisma.chat.update({
                where: { id: chatId },
                data: {
                    isDeleted: true,
                }
            });
            if (!deletedChat)
                return;
            const payload = JSON.stringify({
                type: types_1.DELETE_MESSAGE,
                data: {
                    messageId: chatId
                },
            });
            for (const [, memberWs] of this.members) {
                memberWs.send(payload);
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
