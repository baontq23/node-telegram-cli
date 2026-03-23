import { Entry } from "@napi-rs/keyring";

const SERVICE_NAME = "node-telegram-cli";

let keychainAvailable: boolean | null = null;

function isKeychainAvailable(): boolean {
  if (keychainAvailable !== null) return keychainAvailable;
  try {
    const testEntry = new Entry(SERVICE_NAME, "__keychain_test__");
    testEntry.setPassword("test");
    testEntry.deletePassword();
    keychainAvailable = true;
  } catch {
    keychainAvailable = false;
  }
  return keychainAvailable;
}

export function getSecret(key: string): string | null {
  if (!isKeychainAvailable()) return null;
  try {
    const entry = new Entry(SERVICE_NAME, key);
    return entry.getPassword();
  } catch {
    return null;
  }
}

export function setSecret(key: string, value: string): boolean {
  if (!isKeychainAvailable()) return false;
  try {
    const entry = new Entry(SERVICE_NAME, key);
    entry.setPassword(value);
    return true;
  } catch {
    return false;
  }
}

export function deleteSecret(key: string): boolean {
  if (!isKeychainAvailable()) return false;
  try {
    const entry = new Entry(SERVICE_NAME, key);
    entry.deletePassword();
    return true;
  } catch {
    return false;
  }
}

export function isAvailable(): boolean {
  return isKeychainAvailable();
}
