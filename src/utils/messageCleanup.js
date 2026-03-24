const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function triggerMessageStillExists(triggerMessage) {
  try {
    await triggerMessage.channel.messages.fetch(triggerMessage.id);
    return true;
  } catch (error) {
    return false;
  }
}

async function deleteMessagesAbove(triggerMessage, config) {
  let before = triggerMessage.id;
  let deletedCount = 0;

  while (deletedCount < config.deleteMaxMessages) {
    if (!(await triggerMessageStillExists(triggerMessage))) {
      return deletedCount;
    }

    const fetchCount = Math.min(100, config.deleteMaxMessages - deletedCount);
    const batch = await triggerMessage.channel.messages.fetch({
      limit: fetchCount,
      before
    });

    const targets = [...batch.values()]
      .filter((message) => !message.pinned && !message.system)
      .sort((a, b) => b.createdTimestamp - a.createdTimestamp);

    if (targets.length === 0) {
      return deletedCount;
    }

    for (const message of targets) {
      if (!(await triggerMessageStillExists(triggerMessage))) {
        return deletedCount;
      }

      try {
        await message.delete();
        deletedCount += 1;
        await wait(config.deleteIntervalMs);
      } catch (error) {
        console.error(`Failed to delete message ${message.id}:`, error.message);
      }

      before = message.id;

      if (deletedCount >= config.deleteMaxMessages) {
        return deletedCount;
      }
    }
  }

  return deletedCount;
}

module.exports = {
  deleteMessagesAbove
};
