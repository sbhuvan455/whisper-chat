export interface ROOM {
    roomId: string;
    adminId: string;
    title: string;
    description: string;
}

export interface User {
    id: string;
    username: string;
    email: string;
}

export const CREATE_ROOM = 'create-room';
export const JOIN_ROOM = 'join-room';
export const ROOM_NOT_FOUND = 'room-not-found';
export const PERMISSION = 'permission';
export const ACCEPT_USER = 'accept-user';
export const NEW_MESSAGE = 'new-message';