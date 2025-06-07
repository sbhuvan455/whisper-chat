import { WebSocket } from 'ws';
import { prisma } from '..';
import { Chat } from '../../generated/prisma';
import { MEMBERS_UPDATE, NEW_MESSAGE, REMOVED } from '../types';

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

    addMember(user: any, ws: WebSocket) {
        this.members.set(user.id, ws);

        const payload = JSON.stringify({
            type: MEMBERS_UPDATE,
            data: {
                user
            },
        });

        for (const [, memberWs] of this.members) {
            if(memberWs == this.members.get(user.id)) continue;
            memberWs.send(payload);
        }
    }

    removeMember(user: any) {
        const payload = JSON.stringify({
            type: REMOVED,
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

    async handleMessage(sender: any, message: string) {
        if (this.isMuted(sender.id)) return;

        const member = await prisma.member.findFirst({
            where: {
                userId: sender.id,
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
                id: chat.id,
                userId: sender.id,
                userName: sender.name,
                message: chat.message,
                createdAt: chat.createdAt,
            },
        });

        for (const [, memberWs] of this.members) {
            if(memberWs == this.members.get(sender.id)) continue;
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
