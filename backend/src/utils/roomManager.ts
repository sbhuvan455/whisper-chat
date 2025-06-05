import { WebSocket } from 'ws';
import { prisma } from '..';
import { Chat } from '../../generated/prisma';
import { NEW_MESSAGE } from '../types';

export class RoomManager {
    private roomId: string;
    private adminId: string;
    private members: Map<string, WebSocket>; // userId -> WebSocket
    private muted: Set<string>; // muted userIds

    constructor(roomId: string, adminId: string) {
        this.roomId = roomId;
        this.adminId = adminId;
        this.members = new Map<string, WebSocket>();
        this.muted = new Set<string>();
    }

    addMember(userId: string, ws: WebSocket) {
        this.members.set(userId, ws);
    }

    removeMember(userId: string) {
        this.members.delete(userId);
        this.muted.delete(userId);
    }

    muteMember(userId: string) {
        this.muted.add(userId);
    }

    unmuteMember(userId: string) {
        this.muted.delete(userId);
    }

    isAdmin(userId: string): boolean {
        return userId === this.adminId;
    }

    isMuted(userId: string): boolean {
        return this.muted.has(userId);
    }

    async restoreChats(): Promise<Chat[]> {
        return await prisma.chat.findMany({
            where: {
                roomId: this.roomId,
                isDeleted: false,
            },
            orderBy: {
                createdAt: 'asc',
            },
        });
    }

    async handleMessage(senderId: string, message: string) {
        if (this.isMuted(senderId)) return;

        const member = await prisma.member.findFirst({
            where: {
                userId: senderId,
                roomId: this.roomId,
            },
        });

        if (!member) return;

        const chat = await prisma.chat.create({
            data: {
                message,
                roomId: this.roomId,
                MemberId: member.id,
            },
        });

        const payload = JSON.stringify({
            type: NEW_MESSAGE,
            data: {
                userId: senderId,
                message: chat.message,
                createdAt: chat.createdAt,
            },
        });

        for (const [, memberWs] of this.members) {
            if(memberWs == this.members.get(senderId)) continue;
            memberWs.send(payload);
        }
    }

    async endRoom() {
        await prisma.room.update({
            where: { id: this.roomId },
            data: { isActive: false },
        });

        for (const [, ws] of this.members) {
            ws.send(JSON.stringify({ type: 'ROOM_CLOSED' }));
            ws.close();
        }

        this.members.clear();
        this.muted.clear();
    }
}
