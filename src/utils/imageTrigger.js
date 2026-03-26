const fs = require("node:fs");
const crypto = require("node:crypto");
const path = require("node:path");
const sharp = require("sharp");

let cachedTriggerSignature = null;
const IMAGE_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
  ".bmp",
  ".heic",
  ".heif",
  ".avif"
]);

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

function hasKnownImageExtension(value) {
  if (!value) {
    return false;
  }

  try {
    const source = value.startsWith("http") ? new URL(value).pathname : value;
    return IMAGE_EXTENSIONS.has(path.extname(source).toLowerCase());
  } catch {
    return IMAGE_EXTENSIONS.has(path.extname(value).toLowerCase());
  }
}

function isProbablyImageAttachment(attachment) {
  if (attachment.contentType?.startsWith("image/")) {
    return true;
  }

  return (
    hasKnownImageExtension(attachment.name) ||
    hasKnownImageExtension(attachment.url) ||
    hasKnownImageExtension(attachment.proxyURL)
  );
}

async function getAttachmentBuffer(attachment) {
  const sources = [attachment.proxyURL, attachment.url].filter(Boolean);
  let lastError = null;

  for (const source of sources) {
    try {
      return await fetchAttachmentBuffer(source);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error("Attachment has no downloadable source.");
}

async function createImageSignature(buffer) {
  const pixels = await sharp(buffer)
    .rotate()
    .resize(8, 8, { fit: "fill" })
    .grayscale()
    .raw()
    .toBuffer();

  const average = pixels.reduce((sum, value) => sum + value, 0) / pixels.length;

  return [...pixels].map((value) => (value >= average ? "1" : "0")).join("");
}

function getHammingDistance(left, right) {
  if (!left || !right || left.length !== right.length) {
    return Number.POSITIVE_INFINITY;
  }

  let distance = 0;

  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) {
      distance += 1;
    }
  }

  return distance;
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

async function getTriggerSignature(config) {
  if (cachedTriggerSignature) {
    return cachedTriggerSignature;
  }

  if (!fs.existsSync(config.triggerImagePath)) {
    return "";
  }

  const buffer = await fs.promises.readFile(config.triggerImagePath);
  cachedTriggerSignature = await createImageSignature(buffer);
  return cachedTriggerSignature;
}

async function isTriggerImage(attachment, config) {
  if (!isProbablyImageAttachment(attachment)) {
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
    const triggerSignature = await getTriggerSignature(config);

    if (!triggerSignature) {
      return false;
    }

    const attachmentBuffer = await getAttachmentBuffer(attachment);
    const attachmentSignature = await createImageSignature(attachmentBuffer);

    return getHammingDistance(triggerSignature, attachmentSignature) <= 12;
  }

  const attachmentBuffer = await getAttachmentBuffer(attachment);
  const attachmentHash = sha256FromBuffer(attachmentBuffer);

  if (attachmentHash === triggerHash) {
    return true;
  }

  const triggerSignature = await getTriggerSignature(config);

  if (!triggerSignature) {
    return false;
  }

  const attachmentSignature = await createImageSignature(attachmentBuffer);

  return getHammingDistance(triggerSignature, attachmentSignature) <= 12;
}

function messageMatchesTriggerText(message, config) {
  if (!config.triggerText) {
    return false;
  }

  return message.content.includes(config.triggerText);
}

module.exports = {
  getTriggerHash,
  isTriggerImage,
  messageMatchesTriggerText
};
