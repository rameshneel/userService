import express from "express";
import { getProfile, getDashboard } from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/profile", verifyJWT, getProfile);
router.get("/dashboard", verifyJWT, getDashboard);

export default router;
