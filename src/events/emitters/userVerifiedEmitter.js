import rabbitMQConnection from "../connection.js";
import logger from "../../config/logger.js";
import { rabbitMQConfig } from "../../config/rabbitMQ.js";

export async function publishUserVerifiedEvent(userData) {
  try {
    const exchange = rabbitMQConfig.exchanges.auth.name;
    const routingKey = "user.verified";
    await rabbitMQConnection.publish(
      "user-channel",
      exchange,
      routingKey,
      userData
    );
    logger.info(`Published user.verified event for ${userData.userId}`);
  } catch (error) {
    logger.error("Failed to publish user.verified event:", error);
    throw error;
  }
}
