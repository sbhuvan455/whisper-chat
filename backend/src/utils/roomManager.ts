import { WebSocket } from 'ws';
import { prisma } from '..';
import { Chat } from '../../generated/prisma';
import { DELETE_MESSAGE, MEMBER_LEAVE, MEMBERS_UPDATE, NEW_MESSAGE, REMOVED, ROOM_CLOSED } from '../types';

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

    async addMember(user: any, ws: WebSocket) {
        this.members.set(user.id, ws);

        const payload = JSON.stringify({
            type: MEMBERS_UPDATE,
            data: user,
        });

        for (const [, memberWs] of this.members) {
            if (memberWs == ws) continue;
            memberWs.send(payload);
        }
    }
    async removeMember(user: any) {
        // First, find the member by userId and roomId to get the unique id
        const memberRecord = await prisma.member.findFirst({
            where: {
                userId: user.id as string,
                roomId: this.roomId,
            }
        });

        if (!memberRecord) return;

        const member = await prisma.member.update({
            where: {
                id: memberRecord.id,
            },
            data: {
                online: false,
            }
        })

        // console.log("Member removed:", member);

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

    async leaveRoom(userId: string) {
        // First, find the member by userId and roomId to get the unique id
        const memberRecord = await prisma.member.findFirst({
            where: {
                userId: userId,
                roomId: this.roomId,
            }
        });

        if (!memberRecord) return;

        await prisma.member.update({
            where: {
                id: memberRecord.id,
            },
            data: {
                online: false,
            }
        });

        const ws = this.members.get(userId);

        if (!ws) return;

        if (ws) {
            this.members.delete(userId);
        }

        for (const [, memberWs] of this.members) {
            memberWs.send(JSON.stringify({
                type: MEMBER_LEAVE,
                data: {
                    userId: userId,
                    fullName: memberRecord.fullName,
                },
            }));
        }
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
        // console.log("I am here in the room manager sending messages");
        if (this.isMuted(sender.id)) return;

        const member = await prisma.member.findFirst({
            where: {
                userId: sender.id,
                roomId: this.roomId,
            },
        });

        // console.log("It's not done yet");

        if (!member) return;

        const chat = await prisma.chat.create({
            data: {
                message,
                roomId: this.roomId,
                MemberId: member.id,
            },
        });

        // console.log("It's not done yet");

        const payload = JSON.stringify({
            type: NEW_MESSAGE,
            data: {
                id: chat?.id,
                user: sender,
                type: 'text',
                message: chat?.message,
                createdAt: chat?.createdAt,
            },
        });

        // console.log("It's done now");

        for (const [, memberWs] of this.members) {
            memberWs.send(payload);
        }
    }

    async handleFile(sender: any, fileUrl: string, fileName: string, fileSize: number) {
        try {
            if (this.isMuted(sender.id)) throw new Error("You are muted and cannot send files");

            // console.log("Handling file in room manager:", fileUrl, fileName, fileSize);

            const member = await prisma.member.findFirst({
                where: {
                    userId: sender.id,
                    roomId: this.roomId,
                },
            });

            if (!member) throw new Error("Member not found in this room");

            const chat = await prisma.chat.create({
                data: {
                    reference: fileUrl,
                    fileName: fileName,
                    fileSize: fileSize,
                    roomId: this.roomId,
                    MemberId: member.id,
                    type: 'file',
                },
            });

            if (!chat) throw new Error("Error creating chat message with file");
            // console.log("File chat created:", chat);

            const payload = JSON.stringify({
                type: NEW_MESSAGE,
                data: {
                    id: chat?.id,
                    user: sender,
                    type: 'file',
                    fileUrl: chat?.reference,
                    fileName: chat?.fileName,
                    fileSize: chat?.fileSize,
                    createdAt: chat?.createdAt,
                },
            });

            for (const [, memberWs] of this.members) {
                memberWs.send(payload);
            }
        } catch (error) {
            console.error("Error handling file:", error);
        }
    }

    async deleteMessage(chatId: string, userId: string) {

        try {
            const chat = await prisma.chat.findUnique({
                where: { id: chatId },
                include: { Member: true },
            })

            // console.log("Chat found:", chat, "UserId is", userId);

            if (!chat) throw new Error("Message not found");

            if (userId !== chat?.Member.userId && userId !== this.adminId) throw new Error("You are not authorized to delete this message");

            const deletedChat = await prisma.chat.update({
                where: { id: chatId },
                data: {
                    isDeleted: true,
                }
            })

            if (!deletedChat) throw new Error("Message not found or already deleted");

            const payload = JSON.stringify({
                type: DELETE_MESSAGE,
                data: {
                    messageId: chatId
                },
            });

            for (const [, memberWs] of this.members) {
                memberWs.send(payload);
            }
            // console.log("Message deleted successfully:", deletedChat);
        } catch (error) {
            console.error("Error deleting message:", error);
        }
    }

    async endRoom() {
        await prisma.room.update({
            where: { id: this.roomId },
            data: { isActive: false },
        });

        await prisma.member.updateMany({
            where: {
                roomId: this.roomId,
                online: true,
            },
            data: {
                online: false,
            }
        })

        for (const [, ws] of this.members) {
            ws.send(JSON.stringify({ type: ROOM_CLOSED }));
            ws.close();
        }

        this.members.clear();
        this.muted.clear();
    }
}
