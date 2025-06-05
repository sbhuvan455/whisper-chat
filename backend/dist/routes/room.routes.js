"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
// import { requireAuth } from "@clerk/express";
const room_controller_1 = require("../controller/room.controller");
const router = (0, express_1.Router)();
router.post("/create-room", room_controller_1.createRoom);
exports.default = router;
