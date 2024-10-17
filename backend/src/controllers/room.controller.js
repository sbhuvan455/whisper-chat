import { Room } from "../models/room.model.js";


export const CreateRoom = async (roomInfo) => {
    try {
        const { roomId, userId, socketId } = roomInfo;

        if(!roomId || !socketId || !userId ) throw new Error("All the details must be provided");

        const newRoom = await Room.create({
            room_id: roomId,
            admin_id: userId,
            socket_id: socketId
        })

        if(!newRoom) throw new Error("Unable to create a new room");

        return {
            success: true,
            data: {
                roomId
            }
        }
    } catch (error) {
        return {
            success: false,
            data: error.message
        }
    }
}