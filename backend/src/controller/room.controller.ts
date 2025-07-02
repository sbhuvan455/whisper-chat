// import { clerkClient, getAuth, User } from '@clerk/express'
import { prisma } from '..';
import { ChatManager } from '../utils/chatManager';

export const initializeActiveRooms = async (chatManager: ChatManager) => {
    try {
        const activeRooms = await prisma.room.findMany({
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
    } catch (error) {
        console.error('Error initializing active rooms:', error);
    }
};

export const createNewMember = async (user: any, roomId: string) => {
    console.log("Creating new member for user:", user, "in room:", roomId);
    try {
        const userId = user?.id;
        const image_url = user?.imageUrl || null;
        const fullName = user?.fullName

        if (!userId || !fullName) throw new Error("User Id or Full Name Not Found")

        if (!userId) throw new Error("User Id Not Found")

        const room = await prisma.room.findUnique({
            where: {
                id: roomId
            }
        })

        if (!room) throw new Error("Room Not Found");

        const Member = await prisma.member.findFirst({
            where: {
                roomId,
                userId
            }
        })

        console.log("Member found:", Member);

        const isAdmin = room?.adminId == userId;

        if (Member?.online) return { success: true, isAdmin: isAdmin, isOnline: true, message: "the User is already a member of the room" };

        if (isAdmin) {

            if (!Member) {
                console.log("creating new memeber because previously the member does not exists", Member);
                const newMember = await prisma.member.create({
                    data: {
                        roomId,
                        userId,
                        image_url,
                        fullName,
                    }
                })

                if (!newMember) throw new Error("Error creating member")
            } else {
                await prisma.member.update({
                    where: {
                        id: Member.id
                    },
                    data: {
                        online: true,
                    }
                })
            }

            return { success: true, isAdmin: true, isOnline: false, message: "the User is the admin of the room" };
        }

        return { success: true, isAdmin: false, isOnline: false, message: "the User is not the admin of the room" };
    } catch (error: any) {
        console.log('Error joining room:', error);
        return { success: false, error: error.message };
    }

}

export const acceptUser = async (user: any, roomId: string) => {
    try {
        const userId = user?.id;
        const fullName = user?.fullName;

        console.log("in accept user", user);

        const image_url = user?.imageUrl || null;

        if (!userId || !fullName) throw new Error("User Id or fullname Not Found")

        const room = await prisma.room.findUnique({
            where: {
                id: roomId
            }
        })

        if (!room) throw new Error("Room Not Found");

        const Member = await prisma.member.findFirst({
            where: {
                roomId,
                userId
            }
        })

        if (Member) {
            await prisma.member.update({
                where: {
                    id: Member.id
                },
                data: {
                    online: true,
                }
            })
            return { success: true, message: "User already a member of the room", data: Member };
        }

        const newMember = await prisma.member.create({
            data: {
                roomId,
                userId,
                image_url,
                fullName,
            }
        })

        if (!newMember) throw new Error("Error accepting member")

        return { success: true, message: "User accepted successfully", data: newMember };
    } catch (error: any) {
        console.log('Error accepting user:', error);
        return { success: false, error: error.message };
    }
}