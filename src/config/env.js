import dotenv from "dotenv";

dotenv.config();

export const env = {
  PORT: process.env.PORT || 3002,
  AUTH_SERVICE_URL: process.env.AUTH_SERVICE_URL || "http://localhost:3001",
  RABBITMQ_URL: process.env.RABBITMQ_URL || "amqp://localhost",
};
