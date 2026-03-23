import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import { Logger, LogLevel } from "telegram/extensions/Logger.js";
import { getConfig } from "./config.js";

let _client: TelegramClient | null = null;

export function createClient(): TelegramClient {
  const config = getConfig();
  if (!config.apiId || !config.apiHash) {
    throw new Error("API credentials not configured. Run 'telegram login' first.");
  }

  const session = new StringSession(config.sessionString || "");
  const client = new TelegramClient(session, config.apiId, config.apiHash, {
    connectionRetries: 5,
    baseLogger: new Logger(LogLevel.NONE),
  });

  return client;
}

export async function getClient(): Promise<TelegramClient> {
  if (_client && _client.connected) {
    return _client;
  }

  _client = createClient();
  await _client.connect();
  return _client;
}

export async function withClient<T>(fn: (client: TelegramClient) => Promise<T>): Promise<T> {
  const client = await getClient();
  try {
    return await fn(client);
  } finally {
    // Keep connection open for subsequent commands in same session
  }
}

export async function disconnectClient(): Promise<void> {
  if (_client) {
    try {
      await _client.disconnect();
    } catch {
      // Ignore disconnect errors
    }
    _client = null;
    // GramJS keeps internal timers/reconnection handlers alive after disconnect,
    // preventing Node.js from exiting naturally. Force exit since all work is done.
    process.exit(0);
  }
}
