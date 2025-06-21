// @ts-nocheck
import { Router } from "express";
// import { requireAuth } from "@clerk/express";
import { createRoom, getAdminId, getAllMembers } from "../controller/api.controller";

const router = Router();

router.post("/create-room", createRoom);
router.post("/get-admin", getAdminId);
router.post("/get-members", getAllMembers);

export default router;