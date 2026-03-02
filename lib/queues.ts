// lib/queues.ts

import amqp from "amqplib";

const RABBITMQ_URL =
  process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672";

let connection: any = null;
let channel: any = null;

async function getChannel() {
  if (!connection) {
    connection = await amqp.connect(RABBITMQ_URL);
  }

  if (!channel) {
    channel = await connection.createChannel();
  }

  return channel;
}

export const createTraitsQueue = async () => {
  const ch = await getChannel();
  const queueName = "traits";

  await ch.assertQueue(queueName, { durable: true });

  return {
    send: (msg: unknown) =>
      ch.sendToQueue(queueName, Buffer.from(JSON.stringify(msg)), {
        persistent: true,
      }),
  };
};

export const createMatchQueue = async (cityId: string) => {
  const ch = await getChannel();
  const queueName = `matches-${cityId}`;

  await ch.assertQueue(queueName, { durable: true });

  return {
    send: (msg: unknown) =>
      ch.sendToQueue(queueName, Buffer.from(JSON.stringify(msg)), {
        persistent: true,
      }),
  };
};
