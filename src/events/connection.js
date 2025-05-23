import amqplib from "amqplib";
import { rabbitMQConfig, EXCHANGE_TYPES } from "../config/rabbitMQ.js";
import logger from "../config/logger.js";

class RabbitMQConnection {
  constructor() {
    this.connection = null;
    this.channels = new Map();
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = rabbitMQConfig.retryMechanism.maxRetries || 10;
    this.reconnectInterval =
      rabbitMQConfig.retryMechanism.initialInterval || 1000;
    this.retryMultiplier = rabbitMQConfig.retryMechanism.multiplier || 2;
  }

  async init() {
    if (this.connection || this.isConnecting) return;

    try {
      this.isConnecting = true;
      logger.info("Connecting to RabbitMQ...");
      this.connection = await amqplib.connect(
        rabbitMQConfig.url,
        rabbitMQConfig.connectionOptions
      );
      this.reconnectAttempts = 0;
      this.isConnecting = false;

      logger.info("Successfully connected to RabbitMQ");
      this._setupEventListeners();
      await this._setupDeadLetterExchange();
      await this._setupDefaultExchanges();
      await this._setupDefaultQueues();
    } catch (error) {
      this.isConnecting = false;
      logger.error(`Failed to connect to RabbitMQ: ${error.message}`);
      await this._handleReconnect();
    }
  }

  _setupEventListeners() {
    this.connection.on("error", async (error) => {
      logger.error(`RabbitMQ connection error: ${error.message}`);
      await this._handleReconnect();
    });

    this.connection.on("close", async () => {
      logger.warn("RabbitMQ connection closed");
      await this._handleReconnect();
    });
  }

  async _handleReconnect() {
    if (this.isConnecting) return;

    // Close existing connection if any
    if (this.connection) {
      try {
        await this.connection.close();
      } catch (error) {
        logger.error(`Error closing RabbitMQ connection: ${error.message}`);
      }
      this.connection = null;
    }

    // Close all channels
    for (const [name, channel] of this.channels.entries()) {
      try {
        await channel.close();
      } catch (error) {
        logger.error(`Error closing channel ${name}: ${error.message}`);
      }
    }
    this.channels.clear();

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay =
        this.reconnectInterval *
        Math.pow(this.retryMultiplier, this.reconnectAttempts - 1);
      logger.info(
        `Attempting to reconnect to RabbitMQ in ${delay}ms... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
      );

      setTimeout(() => {
        this.init().catch((error) => {
          logger.error(`Reconnection attempt failed: ${error.message}`);
        });
      }, delay);
    } else {
      logger.error(
        `Failed to reconnect to RabbitMQ after ${this.maxReconnectAttempts} attempts`
      );
      // TODO: Implement circuit breaker or notify monitoring system (e.g., alert to Sentry)
    }
  }

  async _setupDeadLetterExchange() {
    const channel = await this.createChannel("dlx-setup");

    const { name, type, queue, routingKey, queueOptions } =
      rabbitMQConfig.deadLetterExchange;

    // Create dead letter exchange
    await channel.assertExchange(name, type, {
      durable: true,
      autoDelete: false,
    });

    // Create dead letter queue
    await channel.assertQueue(
      queue,
      queueOptions || {
        durable: true,
        arguments: {
          "x-message-ttl": 7 * 24 * 60 * 60 * 1000, // 7 days fallback
        },
      }
    );

    // Bind queue to exchange
    await channel.bindQueue(queue, name, routingKey);

    logger.info(
      `Dead letter exchange '${name}' and queue '${queue}' set up successfully`
    );

    await this.closeChannel("dlx-setup");
  }

  async _setupDefaultExchanges() {
    const channel = await this.createChannel("exchange-setup");

    for (const [key, exchange] of Object.entries(rabbitMQConfig.exchanges)) {
      await channel.assertExchange(
        exchange.name,
        exchange.type,
        exchange.options
      );
      logger.info(
        `Exchange '${exchange.name}' of type '${exchange.type}' set up successfully`
      );
    }

    await this.closeChannel("exchange-setup");
  }

  async _setupDefaultQueues() {
    const channel = await this.createChannel("queue-setup");

    for (const [key, queueConfig] of Object.entries(rabbitMQConfig.queues)) {
      await channel.assertQueue(queueConfig.name, queueConfig.options);
      for (const binding of queueConfig.bindings) {
        await channel.bindQueue(
          queueConfig.name,
          binding.exchange,
          binding.routingKey
        );
      }

      logger.info(`Queue '${queueConfig.name}' set up and bound successfully`);
    }

    await this.closeChannel("queue-setup");
  }

  async createChannel(name) {
    if (!this.connection) {
      await this.init();
    }
    if (this.channels.has(name)) {
      const channel = this.channels.get(name);
      // Validate channel is still open
      try {
        await channel.checkQueue(""); // Dummy check to verify channel
        return channel;
      } catch (error) {
        logger.warn(`Channel '${name}' is invalid, recreating...`);
        this.channels.delete(name);
      }
    }

    try {
      const channel = await this.connection.createChannel();
      this.channels.set(name, channel);

      channel.on("error", (error) => {
        logger.error(`Channel '${name}' error: ${error.message}`);
        this.channels.delete(name);
      });

      channel.on("close", () => {
        logger.info(`Channel '${name}' closed`);
        this.channels.delete(name);
      });

      return channel;
    } catch (error) {
      logger.error(`Failed to create channel '${name}': ${error.message}`);
      throw error;
    }
  }

  async closeChannel(name) {
    if (this.channels.has(name)) {
      try {
        await this.channels.get(name).close();
        this.channels.delete(name);
        logger.info(`Channel '${name}' closed successfully`);
      } catch (error) {
        logger.error(`Error closing channel '${name}': ${error.message}`);
      }
    }
  }

  async createExchange(channelName, exchangeName, type, options = {}) {
    const channel = await this.createChannel(channelName);

    const defaultOptions = {
      durable: true,
      autoDelete: false,
    };

    await channel.assertExchange(exchangeName, type, {
      ...defaultOptions,
      ...options,
    });
    logger.info(`Exchange '${exchangeName}' created successfully`);
  }

  async createQueue(channelName, queueName, options = {}) {
    const channel = await this.createChannel(channelName);

    const defaultOptions = {
      durable: true,
      deadLetterExchange: rabbitMQConfig.deadLetterExchange.name,
      messageTtl: 86400000, // 24 hours
    };

    const queueResult = await channel.assertQueue(queueName, {
      ...defaultOptions,
      ...options,
    });
    logger.info(`Queue '${queueName}' created successfully`);
    return queueResult;
  }

  async bindQueue(channelName, queueName, exchangeName, routingKey) {
    const channel = await this.createChannel(channelName);
    await channel.bindQueue(queueName, exchangeName, routingKey);
    logger.info(
      `Queue '${queueName}' bound to exchange '${exchangeName}' with routing key '${routingKey}'`
    );
  }

  async publish(channelName, exchangeName, routingKey, content, options = {}) {
    if (!this.connection) {
      await this.init();
    }
    const channel = await this.createChannel(channelName);

    const defaultOptions = {
      persistent: true,
      contentType: "application/json",
      contentEncoding: "utf-8",
      timestamp: Date.now(),
      headers: {},
    };

    const publishOptions = { ...defaultOptions, ...options };
    const buffer = Buffer.isBuffer(content)
      ? content
      : Buffer.from(JSON.stringify(content));

    const result = channel.publish(
      exchangeName,
      routingKey,
      buffer,
      publishOptions
    );

    if (result) {
      logger.info(
        `Message published to exchange '${exchangeName}' with routing key '${routingKey}'`
      );
    } else {
      logger.warn(
        `Failed to publish message to exchange '${exchangeName}' with routing key '${routingKey}'`
      );
    }

    return result;
  }

  async consume(channelName, queueName, callback, options = {}) {
    if (!this.connection) {
      await this.init();
    }
    const channel = await this.createChannel(channelName);

    if (rabbitMQConfig.consumerOptions.prefetch) {
      await channel.prefetch(rabbitMQConfig.consumerOptions.prefetch);
    }

    const defaultOptions = {
      noAck: rabbitMQConfig.consumerOptions.noAck,
    };

    const consumeOptions = { ...defaultOptions, ...options };

    const { consumerTag } = await channel.consume(
      queueName,
      async (msg) => {
        if (msg === null) {
          logger.warn(`Consumer was cancelled by RabbitMQ: ${queueName}`);
          return;
        }

        try {
          const content = JSON.parse(msg.content.toString());
          // Wrap callback in try-catch to handle sync errors
          await Promise.resolve(callback(content, msg, channel));
          if (!consumeOptions.noAck) {
            channel.ack(msg);
          }
        } catch (error) {
          logger.error(
            `Error processing message from queue '${queueName}': ${error.message}`
          );
          if (!consumeOptions.noAck) {
            channel.nack(msg, false, false);
          }
        }
      },
      consumeOptions
    );

    logger.info(
      `Consumer started for queue '${queueName}' with tag '${consumerTag}'`
    );
    return consumerTag;
  }

  async cancelConsumer(channelName, consumerTag) {
    if (!this.channels.has(channelName)) {
      logger.warn(
        `Channel '${channelName}' not found for cancelling consumer '${consumerTag}'`
      );
      return;
    }

    const channel = this.channels.get(channelName);
    await channel.cancel(consumerTag);
    logger.info(`Consumer '${consumerTag}' cancelled successfully`);
  }

  async close() {
    for (const [name, channel] of this.channels.entries()) {
      try {
        await channel.close();
        logger.info(`Channel '${name}' closed`);
      } catch (error) {
        logger.error(`Error closing channel '${name}': ${error.message}`);
      }
    }
    this.channels.clear();

    if (this.connection) {
      try {
        await this.connection.close();
        this.connection = null;
        logger.info("RabbitMQ connection closed");
      } catch (error) {
        logger.error(`Error closing RabbitMQ connection: ${error.message}`);
      }
    }
  }
}

const rabbitMQConnection = new RabbitMQConnection();
export default rabbitMQConnection;
