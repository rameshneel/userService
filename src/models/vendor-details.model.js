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
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    country: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    companyName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "vendor_details",
    timestamps: true,
    indexes: [{ fields: ["userId"] }, { fields: ["companyName"] }],
  }
);

export default VendorDetails;
