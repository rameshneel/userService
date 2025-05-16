import { DataTypes } from "sequelize";
import sequelize from "../db/index.js";

const CustomerDetails = sequelize.define(
  "CustomerDetails",
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
    fullName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    orderHistory: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "customer_details",
    timestamps: true,
    indexes: [{ fields: ["userId"] }],
  }
);

export default CustomerDetails;
