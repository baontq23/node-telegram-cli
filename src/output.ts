// Global JSON output mode flag
let _jsonMode = false;

export function setJsonMode(enabled: boolean): void {
  _jsonMode = enabled;
}

export function isJsonMode(): boolean {
  return _jsonMode;
}

/**
 * Output data: JSON to stdout in json mode, or run the human-readable formatter.
 */
export async function output(data: unknown, humanFormatter: () => Promise<void>): Promise<void> {
  if (_jsonMode) {
    console.log(JSON.stringify(data, null, 2));
  } else {
    await humanFormatter();
  }
}

/**
 * Output a simple success/error result.
 */
export function outputResult(result: { ok: boolean; [key: string]: unknown }): void {
  if (_jsonMode) {
    console.log(JSON.stringify(result));
  }
}
