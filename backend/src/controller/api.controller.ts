import { prisma } from "..";
import { Request, Response } from 'express';


export const createRoom = async (req: Request, res: Response) => {
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

export const getAdminId = async (req: Request, res: Response) => {
    const { roomId } = req.body;

    if (!roomId) {
        return res.status(400).json({ error: 'Missing roomId parameter' });
    }

    try {
        const room = await prisma.room.findUnique({
            where: { id: roomId },
            select: { adminId: true },
        });

        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }

        return res.status(200).json({ adminId: room.adminId });
    } catch (error) {
        console.error('Error fetching adminId:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getAllMembers = async (req: Request, res: Response) => {
    const { roomId } = req.body;

    if (!roomId) {
        return res.status(400).json({ error: 'Missing roomId parameter' });
    }

    try {
        const members = await prisma.member.findMany({
            where: { roomId, online: true },
        });

        return res.status(200).json({ members });
    } catch (error) {
        console.error('Error fetching members:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}