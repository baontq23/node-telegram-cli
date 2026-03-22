import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import type { TelegramConfig } from "./types.js";

const CONFIG_DIR = path.join(os.homedir(), ".telegram-cli");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

function ensureConfigDir(): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

export function getConfigDir(): string {
  ensureConfigDir();
  return CONFIG_DIR;
}

export function getDownloadDir(): string {
  const config = getConfig();
  const dir = config.downloadDir || path.join(CONFIG_DIR, "downloads");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export function getConfig(): TelegramConfig {
  ensureConfigDir();
  if (!fs.existsSync(CONFIG_FILE)) {
    return {
      apiId: 0,
      apiHash: "",
      sessionString: "",
      downloadDir: path.join(CONFIG_DIR, "downloads"),
    };
  }
  try {
    const raw = fs.readFileSync(CONFIG_FILE, "utf-8");
    return JSON.parse(raw) as TelegramConfig;
  } catch {
    return {
      apiId: 0,
      apiHash: "",
      sessionString: "",
      downloadDir: path.join(CONFIG_DIR, "downloads"),
    };
  }
}

export function saveConfig(config: Partial<TelegramConfig>): void {
  ensureConfigDir();
  const existing = getConfig();
  const merged = { ...existing, ...config };
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(merged, null, 2), "utf-8");
}

export function clearSession(): void {
  const config = getConfig();
  config.sessionString = "";
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
}

export function hasSession(): boolean {
  const config = getConfig();
  return !!config.sessionString && !!config.apiId && !!config.apiHash;
}

export function hasCredentials(): boolean {
  const config = getConfig();
  return !!config.apiId && !!config.apiHash;
}
