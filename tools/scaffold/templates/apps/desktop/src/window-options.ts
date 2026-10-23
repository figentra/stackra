/**
 * Stackra file contract:
 * Purpose: the options every window of @figentra/{{NAME}} opens with. The renderer gets no Node: context
 *          isolation and the sandbox stay on; hardware access goes through the main process (owner decision).
 * Boundary: builds the options object; opens no window. Part of the stand-in main process (src/main.ts).
 * Runtime: node
 * Governing contract: ADR 0251 (Electron hardening); ADR 0058 (desktop is Electron).
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
