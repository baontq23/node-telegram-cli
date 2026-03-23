import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import type { TelegramConfig, SecureConfig } from "./types.js";
import * as keychain from "./keychain.js";

const CONFIG_DIR = path.join(os.homedir(), ".telegram-cli");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

// Legacy config interface for migration
interface LegacyConfig {
  apiId?: number;
  apiHash?: string;
  sessionString?: string;
  downloadDir?: string;
}

function ensureConfigDir(): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
  } else {
    // Fix permissions on existing directory
    try {
      fs.chmodSync(CONFIG_DIR, 0o700);
    } catch {
      // Ignore permission errors (e.g., on some Windows systems)
    }
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
      downloadDir: path.join(CONFIG_DIR, "downloads"),
    };
  }
  try {
    const raw = fs.readFileSync(CONFIG_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    return {
      downloadDir: parsed.downloadDir || path.join(CONFIG_DIR, "downloads"),
    };
  } catch {
    return {
      downloadDir: path.join(CONFIG_DIR, "downloads"),
    };
  }
}

export function saveConfig(config: Partial<TelegramConfig>): void {
  ensureConfigDir();
  const existing = getConfig();
  const merged = { ...existing, ...config };
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(merged, null, 2), {
    encoding: "utf-8",
    mode: 0o600,
  });
}

// ─── Secure Config (Keychain) ──────────────────────────────────────

function migrateIfNeeded(): void {
  if (!fs.existsSync(CONFIG_FILE)) return;

  try {
    const raw = fs.readFileSync(CONFIG_FILE, "utf-8");
    const legacy: LegacyConfig = JSON.parse(raw);

    // Check if legacy config has sensitive data to migrate
    if (!legacy.apiId && !legacy.apiHash && !legacy.sessionString) return;

    if (keychain.isAvailable()) {
      // Migrate to keychain
      if (legacy.apiId) {
        keychain.setSecret("apiId", String(legacy.apiId));
      }
      if (legacy.apiHash) {
        keychain.setSecret("apiHash", legacy.apiHash);
      }
      if (legacy.sessionString) {
        keychain.setSecret("session", legacy.sessionString);
      }
    }

    // Strip sensitive data from file regardless
    const clean: TelegramConfig = {
      downloadDir: legacy.downloadDir || path.join(CONFIG_DIR, "downloads"),
    };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(clean, null, 2), {
      encoding: "utf-8",
      mode: 0o600,
    });
  } catch {
    // Ignore migration errors
  }
}

let migrated = false;

function ensureMigrated(): void {
  if (!migrated) {
    migrated = true;
    migrateIfNeeded();
  }
}

export function getSecureConfig(): SecureConfig {
  ensureMigrated();

  if (keychain.isAvailable()) {
    const apiIdStr = keychain.getSecret("apiId");
    const apiHash = keychain.getSecret("apiHash");
    const sessionString = keychain.getSecret("session");

    return {
      apiId: apiIdStr ? parseInt(apiIdStr, 10) : 0,
      apiHash: apiHash || "",
      sessionString: sessionString || "",
    };
  }

  // Fallback: read from file (legacy/headless systems)
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      const raw = fs.readFileSync(CONFIG_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      return {
        apiId: parsed.apiId || 0,
        apiHash: parsed.apiHash || "",
        sessionString: parsed.sessionString || "",
      };
    } catch {
      // fall through
    }
  }

  return { apiId: 0, apiHash: "", sessionString: "" };
}

export function saveSecureConfig(config: Partial<SecureConfig>): void {
  ensureMigrated();

  if (keychain.isAvailable()) {
    if (config.apiId !== undefined) {
      keychain.setSecret("apiId", String(config.apiId));
    }
    if (config.apiHash !== undefined) {
      keychain.setSecret("apiHash", config.apiHash);
    }
    if (config.sessionString !== undefined) {
      keychain.setSecret("session", config.sessionString);
    }
    return;
  }

  // Fallback: save to file with warning
  console.warn("⚠️  OS Keychain unavailable. Credentials saved to config file.");
  ensureConfigDir();
  const existing = fs.existsSync(CONFIG_FILE)
    ? JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"))
    : {};
  const merged = { ...existing, ...config };
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(merged, null, 2), {
    encoding: "utf-8",
    mode: 0o600,
  });
}

export function clearSession(): void {
  if (keychain.isAvailable()) {
    keychain.deleteSecret("session");
    return;
  }

  // Fallback: clear from file
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      const raw = fs.readFileSync(CONFIG_FILE, "utf-8");
      const config = JSON.parse(raw);
      delete config.sessionString;
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), {
        encoding: "utf-8",
        mode: 0o600,
      });
    } catch {
      // Ignore
    }
  }
}

export function hasSession(): boolean {
  const secure = getSecureConfig();
  return !!secure.sessionString && !!secure.apiId && !!secure.apiHash;
}

export function hasCredentials(): boolean {
  const secure = getSecureConfig();
  return !!secure.apiId && !!secure.apiHash;
}
