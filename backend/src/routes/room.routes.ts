// @ts-nocheck
import { Router } from "express";
// import { requireAuth } from "@clerk/express";
import { createRoom, getAdminId, getAllMembers, getChatSummary } from "../controller/api.controller";

const router = Router();

router.post("/create-room", createRoom);
router.post("/get-admin", getAdminId);
router.post("/get-members", getAllMembers);
router.get("/get-chat-summary/:roomId", getChatSummary);

export default router;