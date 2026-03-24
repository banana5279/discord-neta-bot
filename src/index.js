require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  Partials
} = require("discord.js");
const {
  tsukkomiLines,
  fakeExcuses,
  dramaticLines,
  mentionReplies
} = require("./data/jokes");
const config = require("./config");
const { isTriggerImage, messageMatchesTriggerText } = require("./utils/imageTrigger");
const { deleteMessagesAbove } = require("./utils/messageCleanup");
const { shouldAutoDeleteMessage, deleteMatchedMessage } = require("./utils/autoDelete");

const token = process.env.DISCORD_TOKEN;
const prefix = config.prefix;

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

const pickRandom = (items) => items[Math.floor(Math.random() * items.length)];

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

const commands = {
  ping: () => "Pong! 生きてるけど、たまに情緒は不安定です。",
  saikoro: () => `サイコロの結果: **${Math.floor(Math.random() * 6) + 1}**`,
  excuse: () => `今日の言い訳: ${pickRandom(fakeExcuses)}`,
  tsukkomi: (args) => {
    const target = args.join(" ").trim();

    if (!target) {
      return `ツッコミ: ${pickRandom(tsukkomiLines)}`;
    }

    return `「${target}」\n${pickRandom(tsukkomiLines)}`;
  },
  drama: () => pickRandom(dramaticLines),
  help: () =>
    [
      "使えるコマンド一覧:",
      `\`${prefix}ping\` - 生存確認`,
      `\`${prefix}saikoro\` - 1〜6を振る`,
      `\`${prefix}excuse\` - 雑な言い訳を出す`,
      `\`${prefix}tsukkomi [文章]\` - ツッコミを入れる`,
      `\`${prefix}drama\` - 無駄に壮大な一言を言う`,
      `\`${prefix}help\` - この一覧を表示`
    ].join("\n")
};

client.once("ready", () => {
  console.log(`${client.user.tag} is online.`);
});

client.on("messageCreate", async (message) => {
  try {
    if (message.author.bot) {
      return;
    }

    if (shouldAutoDeleteMessage(message, config)) {
      await deleteMatchedMessage(message);
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
        await safeReply(message, "画像判定でこけた。画像ファイルか権限を見直してみて。");
        return;
      }
    }

    if (message.mentions.has(client.user) && !message.content.startsWith(prefix)) {
      await safeReply(message, pickRandom(mentionReplies));
      return;
    }

    if (!message.content.startsWith(prefix)) {
      return;
    }

    const body = message.content.slice(prefix.length).trim();

    if (!body) {
      await safeReply(message, `コマンドを入れてね。 \`${prefix}help\` で一覧を見られるよ。`);
      return;
    }

    const [name, ...args] = body.split(/\s+/);
    const command = commands[name.toLowerCase()];

    if (!command) {
      await safeReply(message, `そのコマンドはまだ知らないみたい。 \`${prefix}help\` を見てね。`);
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
