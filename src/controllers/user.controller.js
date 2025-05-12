import {
  User,
  CompanyDetails,
  VendorDetails,
  CustomerDetails,
} from "../models/index.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const getProfile = asyncHandler(async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

export const getDashboard = asyncHandler(async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    let details;
    switch (user.type) {
      case "company":
        details = await CompanyDetails.findOne({ where: { userId: user.id } });
        break;
      case "vendor":
        details = await VendorDetails.findOne({ where: { userId: user.id } });
        break;
      case "customer":
        details = await CustomerDetails.findOne({ where: { userId: user.id } });
        break;
    }

    res.json({ user, details });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
});
