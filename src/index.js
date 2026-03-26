require("dotenv").config();

const fs = require("node:fs");
const {
  Client,
  GatewayIntentBits,
  Partials
} = require("discord.js");
const config = require("./config");
const { isTriggerImage, messageMatchesTriggerText } = require("./utils/imageTrigger");
const { deleteMessagesAbove } = require("./utils/messageCleanup");

const token = process.env.DISCORD_TOKEN;
const prefix = config.prefix;
const ruikasuPattern = /るいカス/i;
const gorimachoShunkouPattern = /ゴリマッチョ瞬光/i;

if (!token) {
  console.error("DISCORD_TOKEN is missing. Set it in the .env file.");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

async function safeReply(message, content) {
  try {
    return await message.reply(content);
  } catch (error) {
    console.error("Reply failed, falling back to channel.send:", error.message);

    try {
      return await message.channel.send(content);
    } catch (sendError) {
      console.error("Fallback send failed:", sendError.message);
      return null;
    }
  }
}

async function sendImageReply(message, imagePath, label) {
  if (!fs.existsSync(imagePath)) {
    console.error(`${label} image not found: ${imagePath}`);
    return null;
  }

  try {
    return await message.channel.send({
      files: [imagePath]
    });
  } catch (error) {
    console.error(`Failed to send ${label} image:`, error.message);
    return null;
  }
}

const commands = {
  ping: () => "Pong!"
};

client.once("ready", () => {
  console.log(`${client.user.tag} is online.`);
});

client.on("messageCreate", async (message) => {
  try {
    if (message.author.bot) {
      return;
    }

    if (ruikasuPattern.test(message.content)) {
      await sendImageReply(message, config.ruikasuImagePath, "Ruikasu");
      return;
    }

    if (gorimachoShunkouPattern.test(message.content)) {
      await sendImageReply(message, config.gorimachoShunkouImagePath, "GorimachoShunkou");
      return;
    }

    for (const attachment of message.attachments.values()) {
      try {
        const matchedByImage = await isTriggerImage(attachment, config);
        const matchedByText = messageMatchesTriggerText(message, config);

        if (matchedByImage || matchedByText) {
          await deleteMessagesAbove(message, config);
          return;
        }
      } catch (error) {
        console.error("Image trigger check failed:", error);
        return;
      }
    }

    if (!message.content.startsWith(prefix)) {
      return;
    }

    const body = message.content.slice(prefix.length).trim();

    if (!body) {
      return;
    }

    const [name, ...args] = body.split(/\s+/);
    const command = commands[name.toLowerCase()];

    if (!command) {
      return;
    }

    try {
      const result = command(args, message);
      await safeReply(message, result);
    } catch (error) {
      console.error("Command execution failed:", error);
      await safeReply(message, "ネタが飛んだ。少し置いてからもう一度どうぞ。");
    }
  } catch (error) {
    console.error("Unhandled error in messageCreate:", error);
  }
});

process.on("unhandledRejection", (error) => {
  console.error("Unhandled rejection:", error);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
});

client.login(token);
