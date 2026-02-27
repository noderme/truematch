import * as amqplib from "amqplib";

const RABBITMQ_URL =
  process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672";

let connection: amqplib.Connection | undefined;
let channel: amqplib.Channel | undefined;

async function getChannel(): Promise<amqplib.Channel> {
  if (!connection) {
    connection = await amqplib.connect(RABBITMQ_URL);
    channel = await connection.createChannel();
  }

  if (!channel) {
    throw new Error("Channel failed to initialize");
  }

  return channel;
}

export const createTraitsQueue = async () => {
  const ch = await getChannel();
  const queueName = "traits";
  await ch.assertQueue(queueName, { durable: true });
  return {
    send: (msg: any) =>
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
    send: (msg: any) =>
      ch.sendToQueue(queueName, Buffer.from(JSON.stringify(msg)), {
        persistent: true,
      }),
  };
};
