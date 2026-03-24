const fs = require("node:fs");
const crypto = require("node:crypto");

function sha256FromBuffer(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

async function sha256FromFile(filePath) {
  const buffer = await fs.promises.readFile(filePath);
  return sha256FromBuffer(buffer);
}

async function fetchAttachmentBuffer(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch attachment: ${response.status} ${response.statusText}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

async function getTriggerHash(config) {
  if (config.triggerImageHash) {
    return config.triggerImageHash;
  }

  if (!fs.existsSync(config.triggerImagePath)) {
    return "";
  }

  return sha256FromFile(config.triggerImagePath);
}

async function isTriggerImage(attachment, config) {
  if (!attachment.contentType?.startsWith("image/")) {
    return false;
  }

  if (
    config.triggerImageFilename &&
    attachment.name &&
    attachment.name.toLowerCase() === config.triggerImageFilename.toLowerCase()
  ) {
    return true;
  }

  const triggerHash = await getTriggerHash(config);

  if (!triggerHash) {
    return false;
  }

  const attachmentBuffer = await fetchAttachmentBuffer(attachment.url);
  const attachmentHash = sha256FromBuffer(attachmentBuffer);

  return attachmentHash === triggerHash;
}

function messageMatchesTriggerText(message, config) {
  if (!config.triggerText) {
    return false;
  }

  return message.content.trim() === config.triggerText;
}

module.exports = {
  getTriggerHash,
  isTriggerImage,
  messageMatchesTriggerText
};
