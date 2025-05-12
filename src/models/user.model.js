// userService/src/models/user.model.js
import { DataTypes } from "sequelize";
import sequelize from "../db/index.js";

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    type: {
      type: DataTypes.ENUM("company", "vendor", "customer"),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM(
        "superadmin",
        "admin",
        "manager",
        "salesman",
        "vendor",
        "customer"
      ),
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "users",
    timestamps: true,
    indexes: [
      { fields: ["email"], unique: true },
      { fields: ["type", "role"] },
    ],
  }
);

export default User;
