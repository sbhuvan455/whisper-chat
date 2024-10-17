import mongoose from 'mongoose';


const roomSchema = new mongoose.Schema({
    room_id: {
        type: String,
        required: true
    },
    admin_id: {
        type: String,
        required: true
    },
    socket_id: {
        type: String,
        required: true
    }
}, { timestamps: true });


export const Room = mongoose.model('Room', roomSchema);