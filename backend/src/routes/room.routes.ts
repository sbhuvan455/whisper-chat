import { Router } from "express";
// import { requireAuth } from "@clerk/express";
import { createRoom } from "../controller/room.controller";

const router = Router();

router.post("/create-room", createRoom);

export default router;