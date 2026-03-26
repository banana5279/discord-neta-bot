const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");

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
  ruikasuImagePath: process.env.RUIKASU_IMAGE_PATH
    ? path.resolve(rootDir, process.env.RUIKASU_IMAGE_PATH)
    : path.join(rootDir, "assets", "ruikasu.png"),
  gorimachoShunkouImagePath: process.env.GORIMACHO_SHUNKOU_IMAGE_PATH
    ? path.resolve(rootDir, process.env.GORIMACHO_SHUNKOU_IMAGE_PATH)
    : path.join(rootDir, "assets", "gorimacho-shunkou.png"),
  marieTachiharaNetImagePath: process.env.MARIE_TACHIHARA_NET_IMAGE_PATH
    ? path.resolve(rootDir, process.env.MARIE_TACHIHARA_NET_IMAGE_PATH)
    : path.join(rootDir, "assets", "marie-tachihara-net.png"),
  tachiharaIsamuImagePath: process.env.TACHIHARA_ISAMU_IMAGE_PATH
    ? path.resolve(rootDir, process.env.TACHIHARA_ISAMU_IMAGE_PATH)
    : path.join(rootDir, "assets", "tachihara-isamu.png")
};
