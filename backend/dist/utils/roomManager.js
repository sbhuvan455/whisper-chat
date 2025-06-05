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
    addMember(userId, ws) {
        this.members.set(userId, ws);
    }
    removeMember(userId) {
        this.members.delete(userId);
        this.muted.delete(userId);
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
    handleMessage(senderId, message) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isMuted(senderId))
                return;
            const member = yield __1.prisma.member.findFirst({
                where: {
                    userId: senderId,
                    roomId: this.roomId,
                },
            });
            if (!member)
                return;
            const chat = yield __1.prisma.chat.create({
                data: {
                    message,
                    roomId: this.roomId,
                    MemberId: member.id,
                },
            });
            const payload = JSON.stringify({
                type: types_1.NEW_MESSAGE,
                data: {
                    userId: senderId,
                    message: chat.message,
                    createdAt: chat.createdAt,
                },
            });
            for (const [, memberWs] of this.members) {
                if (memberWs == this.members.get(senderId))
                    continue;
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
