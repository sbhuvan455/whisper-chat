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
            if (memberWs == this.members.get(user.id))
                continue;
            memberWs.send(payload);
        }
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
            if (this.isMuted(sender.id))
                return;
            const member = yield __1.prisma.member.findFirst({
                where: {
                    userId: sender.id,
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
                    id: chat.id,
                    userId: sender.id,
                    userName: sender.name,
                    message: chat.message,
                    createdAt: chat.createdAt,
                },
            });
            for (const [, memberWs] of this.members) {
                if (memberWs == this.members.get(sender.id))
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
