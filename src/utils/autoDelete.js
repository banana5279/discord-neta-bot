function shouldAutoDeleteMessage(message, config) {
  const content = message.content.trim();

  if (!content || config.autoDeleteTexts.length === 0) {
    return false;
  }

  return config.autoDeleteTexts.some((text) => content.includes(text));
}

async function deleteMatchedMessage(message) {
  try {
    await message.delete();
    return true;
  } catch (error) {
    console.error(`Failed to auto-delete message ${message.id}:`, error.message);
    return false;
  }
}

module.exports = {
  shouldAutoDeleteMessage,
  deleteMatchedMessage
};
