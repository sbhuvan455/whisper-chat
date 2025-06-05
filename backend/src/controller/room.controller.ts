// import { clerkClient, getAuth, User } from '@clerk/express'
import { prisma } from '..';

export const createRoom = async (req: any, res: any) => {
    console.log('Creating room with data:', req.body);
    const { title, description } = req.body;

    if (!title || !description) {
        return res.status(400).json({ error: 'title and description are required' });
    }

    const { user } = req.body;

    if (!user) return res.status(401).json({ error: 'Unauthorized' })

    try {
        const room = await prisma.room.create({
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
    } catch (error) {
        // console.error('Error creating room:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

export const createNewMember = async (userId: string, roomId: string) => {
    
    try {
        if(!userId) throw new Error("User Id Not Found")
        // const { id, adminId } = data;

        // if(!id || !adminId) throw new Error("Room Id or Admin Id Not Found");

        const room = await prisma.room.findUnique({
            where: {
                id: roomId
            }
        })

        if(!room) throw new Error("Room Not Found");

        if(userId == room.adminId) {

            const Member = await prisma.member.findFirst({
                where: {
                    roomId,
                    userId
                }
            })

            if(!Member) {
                const newMember = await prisma.member.create({
                    data: {
                        roomId,
                        userId
                    }
                })

                if(!newMember) throw new Error("Error creating member")
            }

            return { success: true, isAdmin: true, message: "the User is the admin of the room" };
        }

        return { success: true, isAdmin: false, message: "the User is not the admin of the room" };
    } catch (error: any) {
        console.log('Error joining room:', error);
        return { success: false, error: error.message };
    }
    
}

export const acceptUser = async (roomId: string, user: any) => {
    try {
        const { userId } = JSON.parse(user.toString()).id;

        if(!userId) throw new Error("User Id Not Found")

        const room = await prisma.room.findUnique({
            where: {
                id: roomId
            }
        })

        if(!room) throw new Error("Room Not Found");

        const Member = await prisma.member.findFirst({
            where: {
                roomId,
                userId
            }
        })

        if(Member) return { success: true, message: "User already a member of the room", data: Member };

        const newMember = await prisma.member.create({
            data: {
                roomId,
                userId
            }
        })

        if(!newMember) throw new Error("Error accepting member")

        return { success: true, message: "User accepted successfully", data: newMember };
    } catch (error: any) {
        console.log('Error accepting user:', error);
        return { success: false, error: error.message };
    }
}