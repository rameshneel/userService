import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/index.model.js";
import axios from "axios";

export const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    const token = req.cookies?.accessToken;

    // ||req.header("Authorization")?.replace("Bearer ", "")
    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }

    const { data } = await axios.post(
      `${process.env.AUTH_SERVICE_URL}/auth/verify-token`,
      { token }
    );

    const user = data?.message;

    if (!user?.valid) {
      throw new ApiError(400, "token not valid");
    }

    req.user = user.user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token");
  }
});
