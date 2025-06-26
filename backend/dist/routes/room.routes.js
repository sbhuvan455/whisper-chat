"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
const express_1 = require("express");
// import { requireAuth } from "@clerk/express";
const api_controller_1 = require("../controller/api.controller");
const router = (0, express_1.Router)();
router.post("/create-room", api_controller_1.createRoom);
router.post("/get-admin", api_controller_1.getAdminId);
router.post("/get-members", api_controller_1.getAllMembers);
router.get("/get-chat-summary/:roomId", api_controller_1.getChatSummary);
exports.default = router;
