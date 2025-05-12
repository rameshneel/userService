import { DataTypes } from "sequelize";
import sequelize from "../db/index.js";

const VendorDetails = sequelize.define(
  "VendorDetails",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    vendorId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    contractDetails: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "vendor_details",
    timestamps: true,
    indexes: [{ fields: ["userId"] }, { fields: ["vendorId"] }],
  }
);

export default VendorDetails;
