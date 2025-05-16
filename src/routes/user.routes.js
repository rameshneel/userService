import express from "express";
import {
  getProfile,
  getDashboard,
  createProfile,
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

export const router = express.Router();
//create
router.post("/create-profile", createProfile);

router.get("/profile", verifyJWT, getProfile);
router.get("/dashboard", verifyJWT, getDashboard);

export default router;
