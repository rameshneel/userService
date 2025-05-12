import { DataTypes } from "sequelize";
import sequelize from "../db/index.js";

const CompanyDetails = sequelize.define(
  "CompanyDetails",
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
    department: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    companyName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "company_details",
    timestamps: true,
    indexes: [{ fields: ["userId"] }],
  }
);

export default CompanyDetails;
