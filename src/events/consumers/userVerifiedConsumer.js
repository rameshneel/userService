import rabbitMQConnection from "../connection.js";
import logger from "../../config/logger.js";
import { rabbitMQConfig } from "../../config/rabbitMQ.js";

export async function startUserCreatedConsumer() {
  try {
    const queue = rabbitMQConfig.queues.userCreated.name;
    await rabbitMQConnection.consume(
      "user-consumer-channel",
      queue,
      async (message, msg, channel) => {
        logger.info("Received user.created event:", message);
        // Example: Save user to UserService DB
        // await saveUserToDatabase(message);
      }
    );
    logger.info(`Started consumer for ${queue}`);
  } catch (error) {
    logger.error("Failed to start user.created consumer:", error);
    throw error;
  }
}
