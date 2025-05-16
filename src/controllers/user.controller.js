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
  const { linkedUserId, type } = req.user;

  try {
    const user = await User.findByPk(linkedUserId);
    if (!user) throw new ApiError(404, "User not found");

    let profile;

    switch (type) {
      case "customer":
        profile = await CustomerDetails.findOne({
          where: { userId: linkedUserId },
        });
        break;
      case "vendor":
        profile = await VendorDetails.findOne({
          where: { userId: linkedUserId },
        });
        break;
      case "company":
        profile = await CompanyDetails.findOne({
          where: { userId: linkedUserId },
        });
        break;
      default:
        throw new ApiError(400, "Invalid user type");
    }

    if (!profile) throw new ApiError(404, "Profile not found");

    const fullProfile = {
      id: user.id,
      email: user.email,
      type: user.type,
      ...profile.toJSON(),
    };

    return res
      .status(200)
      .json(new ApiResponse(200, fullProfile, "Profile fetched successfully"));
  } catch (error) {
    res.status(500).json({ error: error.message });
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

export const createProfile = asyncHandler(async (req, res) => {
  const { email, type, ...extraFields } = req.body;
  console.log("route reaching");
  const user = await User.create({ email, type });

  let profile;
  switch (type) {
    case "customer":
      profile = await CustomerDetails.create({
        userId: user.id,
        fullName: extraFields.fullName,
      });
      break;
    case "vendor":
      profile = await VendorDetails.create({
        userId: user.id,
        name: extraFields.name,
        companyName: extraFields.companyName,
        country: extraFields.country,
        role: extraFields.role,
      });
      break;
    case "company":
      profile = await CompanyDetails.create({
        userId: user.id,
        name: extraFields.name,
        role: extraFields.role,
      });
      break;
    default:
      throw new ApiError(400, "Invalid user type");
  }

  console.log(profile, user);

  return res.status(201).json({
    message: `${type} profile created successfully`,
    userId: user.id,
    profile,
  });
});
