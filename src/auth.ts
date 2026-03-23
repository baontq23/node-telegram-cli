import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import { Logger, LogLevel } from "telegram/extensions/Logger.js";
import { getSecureConfig, hasCredentials, clearSession } from "./config.js";
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
  const { saveSecureConfig } = await import("./config.js");

  console.log(chalk.cyan.bold("\n🔐 Telegram CLI Login\n"));

  // Step 1: Get API credentials if not set
  let apiId: number;
  let apiHash: string;

  if (!hasCredentials()) {
    console.log(chalk.yellow("You need API credentials from https://my.telegram.org\n"));

    const apiIdStr = await prompt(chalk.white("Enter api_id: "));
    apiId = parseInt(apiIdStr, 10);
    if (isNaN(apiId)) {
      console.error(chalk.red("❌ Invalid api_id. Must be a number."));
      process.exit(1);
    }

    apiHash = await prompt(chalk.white("Enter api_hash: "));
    if (!apiHash || apiHash.length < 10) {
      console.error(chalk.red("❌ Invalid api_hash."));
      process.exit(1);
    }

    saveSecureConfig({ apiId, apiHash });
    console.log(chalk.green("✅ API credentials saved to keychain.\n"));
  } else {
    const secure = getSecureConfig();
    apiId = secure.apiId;
    apiHash = secure.apiHash;
    console.log(chalk.gray(`Using saved API credentials (api_id: ${apiId})\n`));
  }

  // Step 2: Create client and authenticate
  const session = new StringSession("");
  const client = new TelegramClient(session, apiId, apiHash, {
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

  // Step 3: Save session to keychain
  const sessionString = client.session.save() as unknown as string;
  saveSecureConfig({ sessionString });

  const me = await client.getMe();
  const displayName = (me as any).firstName || (me as any).username || "User";

  console.log(chalk.green.bold(`\n✅ Logged in as ${displayName}!`));
  console.log(chalk.gray(`Session saved securely to OS Keychain.\n`));

  await client.disconnect();
}

export async function logout(): Promise<void> {
  const chalk = (await import("chalk")).default;

  clearSession();
  console.log(chalk.yellow("👋 Logged out. Session cleared from keychain."));
}
