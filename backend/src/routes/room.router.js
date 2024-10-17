import { Router } from "express";
import { Room } from "../models/room.model.js";

const router = Router();

router.route('/room/:roomId').post(async (req, res) => {
    try {
        const { roomId } = req.params;
        if(!roomId) throw new Error("Room Id is required");

        const { socketId, userId } = req.body;
        if(!socketId | !userId) throw new Error("Socket Id, and userId are both required");

        const room = await Room.findOne({ room_id: roomId })
        if(!room) throw new Error("Room not found");

        if(room.admin_id === userId) {
            room.socket_id = socketId;
            await room.save();
        }

        res.status(200).json({
            success: true,
            data: room
        })

    } catch (error) {
        res.status(500).json(
            {
                success: false,
                data: error.message
            }
        )
    }
})

export default router;