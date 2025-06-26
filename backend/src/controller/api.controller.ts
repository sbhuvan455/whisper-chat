import { prisma } from "..";
import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI('AIzaSyCtKJDY_Gsv6OYj8Z5XpdslIWfbg-Wqpyo');
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });


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

export const getChatSummary = async (req: Request, res: Response) => {
    console.log("Received request to generate chat summary");
    const { roomId } = req.params;

    if (!roomId) throw new Error("Room ID is required");
    console.log("Generating chat summary for room:", roomId);

    try {
        const chats = await prisma.chat.findMany({
            where: {
                roomId: roomId,
                type: 'text',
                isDeleted: false,
            },
            include: {
                Member: {
                    select: {
                        fullName: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: 100,
        });

        if (chats.length === 0) {
            return res.status(200).json({ summary: 'No relevant chat history found for this room.' });
        }

        const formattedChatTranscript = chats
            .reverse()
            .map((chat) => {
                const senderName = chat.Member?.fullName || 'Unknown Member';
                return `${senderName}: ${chat.message}`;
            })
            .join('\n');

        console.log("Formatted chat transcript:", formattedChatTranscript);

        // 3. Construct the prompt for the Gemini model
        const prompt = `You are an AI assistant tasked with summarizing chat conversations.
        Given the following chat transcript from a room, please provide a concise summary of the main topics and key decisions discussed. Focus on the core content and keep it brief, ideally under 100-150 words.

        Chat Transcript:
        ${formattedChatTranscript}

        Summary:
        `;

        // 4. Make the API call to Gemini
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const summary = response.text();

        // 5. Return the summary
        return res.status(200).json({ summary });

    } catch (error: any) {
        console.error('Error generating chat summary:', error);
        if (error.response && error.response.data) {
            console.error('Gemini API Error details:', error.response.data);
        }
        return res.status(500).json({ error: 'Failed to generate chat summary. Please try again later.' });
    }
}