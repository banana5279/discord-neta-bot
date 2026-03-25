const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const defaultAutoDeleteTexts = [
  "やっぱ裸",
  "裸見られた",
  "従兄弟に裸見られた"
];

const autoDeleteTexts = (process.env.AUTO_DELETE_TEXTS || defaultAutoDeleteTexts.join("||"))
  .split("||")
  .map((text) => text.trim())
  .filter(Boolean);

module.exports = {
  prefix: process.env.PREFIX || "!",
  triggerImagePath: process.env.TRIGGER_IMAGE_PATH
    ? path.resolve(rootDir, process.env.TRIGGER_IMAGE_PATH)
    : path.join(rootDir, "assets", "delete-trigger.png"),
  triggerImageFilename: (process.env.TRIGGER_IMAGE_FILENAME || "delete-trigger.png").trim(),
  triggerText: (process.env.TRIGGER_TEXT || "delete").trim(),
  triggerImageHash: (process.env.TRIGGER_IMAGE_HASH || "").trim().toLowerCase(),
  deleteIntervalMs: Number(process.env.DELETE_INTERVAL_MS || 1000),
  deleteMaxMessages: Number(process.env.DELETE_MAX_MESSAGES || 50),
  autoDeleteTexts
};
