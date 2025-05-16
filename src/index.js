import dotenv from "dotenv";
import sequelize from "./db/index.js";
import { app } from "./app.js";
import logger from "./config/logger.js";
import { initializeEvents } from "./events/index.js";

dotenv.config({
  path: "./.env",
});

// // Initialize RabbitMQ and consumers
// async function startApp() {
//   try {
//     await initializeEvents();
//     logger.info("Events initialized in AuthService");
//   } catch (error) {
//     logger.error("Failed to start AuthService:", error);
//     process.exit(1);
//   }
// }

// startApp();

// Sync without dropping tables (no data loss)
sequelize
  .sync({ force: false })
  .then(() => {
    console.log("✔️ Tables synchronized successfully!");

    // Authenticate DB connection and start the server
    sequelize
      .authenticate()
      .then(() => {
        app.listen(process.env.PORT || 8900, () => {
          console.log(
            `⚙️ Server is running at port : ${process.env.PORT || 8900}`
          );
        });
      })
      .catch((err) => {
        console.log("❌ MySQL db connection failed: ", err);
      });
  })
  .catch((err) => {
    console.log("❌ Error synchronizing tables: ", err);
  });
