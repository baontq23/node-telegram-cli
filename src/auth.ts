import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import { Logger, LogLevel } from "telegram/extensions/Logger.js";
import { getConfig, saveConfig, clearSession, hasCredentials } from "./config.js";
import * as readline from "readline";

function prompt(question: string, hidden = false): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    if (hidden) {
      // For password input, we mute output
      const stdout = process.stdout;
      rl.question(question, (answer) => {
        rl.close();
        stdout.write("\n");
        resolve(answer);
      });
      // @ts-expect-error - _writeToOutput is internal but needed for hidden input
      rl._writeToOutput = function _writeToOutput(str: string) {
        if (str.includes(question)) {
          stdout.write(str);
        } else {
          stdout.write("*");
        }
      };
    } else {
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer);
      });
    }
  });
}

export async function login(): Promise<void> {
  const chalk = (await import("chalk")).default;

  console.log(chalk.cyan.bold("\n🔐 Telegram CLI Login\n"));

  let config = getConfig();

  // Step 1: Get API credentials if not set
  if (!hasCredentials()) {
    console.log(chalk.yellow("You need API credentials from https://my.telegram.org\n"));

    const apiIdStr = await prompt(chalk.white("Enter api_id: "));
    const apiId = parseInt(apiIdStr, 10);
    if (isNaN(apiId)) {
      console.error(chalk.red("❌ Invalid api_id. Must be a number."));
      process.exit(1);
    }

    const apiHash = await prompt(chalk.white("Enter api_hash: "));
    if (!apiHash || apiHash.length < 10) {
      console.error(chalk.red("❌ Invalid api_hash."));
      process.exit(1);
    }

    saveConfig({ apiId, apiHash });
    config = getConfig();
    console.log(chalk.green("✅ API credentials saved.\n"));
  } else {
    console.log(chalk.gray(`Using saved API credentials (api_id: ${config.apiId})\n`));
  }

  // Step 2: Create client and authenticate
  const session = new StringSession("");
  const client = new TelegramClient(session, config.apiId, config.apiHash, {
    connectionRetries: 5,
    baseLogger: new Logger(LogLevel.NONE),
  });

  await client.start({
    phoneNumber: async () => {
      return await prompt(chalk.white("📱 Enter phone number (e.g. +84901234567): "));
    },
    password: async () => {
      return await prompt(chalk.white("🔑 Enter 2FA password: "), true);
    },
    phoneCode: async () => {
      return await prompt(chalk.white("📨 Enter the OTP code from Telegram: "));
    },
    onError: (err: Error) => {
      console.error(chalk.red(`❌ Error: ${err.message}`));
    },
  });

  // Step 3: Save session
  const sessionString = client.session.save() as unknown as string;
  saveConfig({ sessionString });

  const me = await client.getMe();
  const displayName = (me as any).firstName || (me as any).username || "User";

  console.log(chalk.green.bold(`\n✅ Logged in as ${displayName}!`));
  console.log(chalk.gray(`Session saved to ~/.telegram-cli/config.json\n`));

  await client.disconnect();
}

export async function logout(): Promise<void> {
  const chalk = (await import("chalk")).default;

  clearSession();
  console.log(chalk.yellow("👋 Logged out. Session cleared."));
}
