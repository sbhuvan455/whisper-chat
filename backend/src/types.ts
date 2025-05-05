export interface ROOM {
    id: string;
    adminId: string;
    title: string;
    description: string;
}

export const CREATE_ROOM = 'create-room';
export const JOIN_ROOM = 'join-room';
export const ROOM_NOT_FOUND = 'room-not-found';
export const ACCEPT_USER = 'accept-user';