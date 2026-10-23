/**
 * Stackra file contract:
 * Purpose: Electron main process of @figentra/{{NAME}} — opens one window on the bundled renderer and quits when
 *          the last window closes (except on macOS). A stand-in for the desktop entry gen writes (ADR 0295 decision 7).
 * Boundary: window lifecycle only; hardware and OS access go through the main process, never the renderer.
 * Runtime: node
 * Governing contract: ADR 0295 (decisions 7 and 8); ADR 0058 (desktop is Electron).
 */
import { app, BrowserWindow } from "electron";

import { windowOptions } from "./window-options";

// shortcut: authored until stackra gen writes `.stackra/entry/electron.ts` (createApp returns a DesktopApp, STA-339);
// then delete this file and window-options.ts.
async function open(): Promise<void> {
  const window = new BrowserWindow(windowOptions());
  await window.loadFile(new URL("../src/renderer/index.html", import.meta.url).pathname);
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) void open();
});
void app.whenReady().then(open);
