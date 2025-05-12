import sequelize from "../db/index.js";
import User from "./user.model.js";
import CompanyDetails from "./company-details.model.js";
import VendorDetails from "./vendor-details.model.js";
import CustomerDetails from "./customer-details.model.js";

User.hasOne(CompanyDetails, { foreignKey: "userId", onDelete: "CASCADE" });
CompanyDetails.belongsTo(User, { foreignKey: "userId" });

User.hasOne(VendorDetails, { foreignKey: "userId", onDelete: "CASCADE" });
VendorDetails.belongsTo(User, { foreignKey: "userId" });

User.hasOne(CustomerDetails, { foreignKey: "userId", onDelete: "CASCADE" });
CustomerDetails.belongsTo(User, { foreignKey: "userId" });

export { sequelize, User, CompanyDetails, VendorDetails, CustomerDetails };
