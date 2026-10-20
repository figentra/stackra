/**
 * Stackra file contract:
 * Purpose: the options every window of @figentra/{{NAME}} opens with. The renderer gets no Node: context
 *          isolation and the sandbox stay on; hardware access goes through the main process (owner decision).
 * Owner: the app owner · Secrets: forbidden
 */
import type { BrowserWindowConstructorOptions } from "electron";

/** Window options with the renderer locked down; size is the only thing a caller may change. */
export function windowOptions(width = 1200, height = 800): BrowserWindowConstructorOptions {
  return {
    width,
    height,
    title: "{{TITLE}}",
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true },
  };
}
