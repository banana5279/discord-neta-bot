require("dotenv").config();

const config = require("../config");
const { getTriggerHash } = require("../utils/imageTrigger");

async function main() {
  const hash = await getTriggerHash(config);

  if (!hash) {
    console.log("Trigger image was not found.");
    console.log(`Expected path: ${config.triggerImagePath}`);
    process.exit(1);
  }

  console.log(`Trigger hash: ${hash}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
