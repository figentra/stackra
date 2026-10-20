/**
 * Stackra file contract:
 * Purpose: Electron main process of @figentra/{{NAME}} — opens one window on the bundled renderer and quits when
 *          the last window closes (except on macOS).
 * Owner: the app owner · Secrets: forbidden
 */
import { app, BrowserWindow } from "electron";

import { windowOptions } from "./window-options";

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
