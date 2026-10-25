/**
 * Stackra file contract:
 * Purpose: `createApp` of the Electron main process: boots the main-process wiring, and returns the `DesktopApp`
 *          whose `start()` applies the hardening baseline (context isolation, sandbox, no node integration, web
 *          security, no webview, the CSP header from the CSP configuration, navigation and window-open guards,
 *          permission handlers deny), serves the renderer bundle as `app://bundle/`, answers bridge calls on
 *          `BRIDGE_CHANNEL`, opens the main window and checks the update feed when packaged.
 * Boundary: the baseline is not configurable (ADR 0251 decision 3); fuses are set at packaging, not here. A bridge
 *           call is answered only for a frame whose URL starts with one of `bridgeSenders`, and only for a class the
 *           wiring binds with kind `bridge`, each call on its own request container; an unexpected bridge error is
 *           reported once, a refusal is not. A window may navigate only to the same origins; every `window.open` is
 *           denied, and an `https:` one opens in the system browser.
 * Runtime: node
 * Governing contract: ADR 0295 (decisions 7 and 8); ADR 0251 (decisions 1 to 3); ADR 0249; ADR 0232 (decision 8).
 */
import { buildConfig } from "@stackra/config";
import type { AnyClass } from "@stackra/container";
import { CspConfig, contentSecurityPolicy, cspHeaderName } from "@stackra/csp";
import { isRefusal } from "@stackra/errors";
import { app, autoUpdater, BrowserWindow, ipcMain, net, protocol, session, shell } from "electron";
import { fileURLToPath } from "node:url";

import { bootApp } from "#core/functions/boot-app.function";
import { BRIDGE_CHANNEL } from "#desktop/constants/bridge-channel.constant";
import { bundleFileUrl } from "#desktop/functions/bundle-file-url.function";
import type { DesktopApp } from "#desktop/types/desktop-app.type";
import type { DesktopAppOptions } from "#desktop/types/desktop-app-options.type";

/** What a bridge class exposes to the renderer. */
interface BridgeInstance {
  handle(input: unknown): unknown;
}

/**
 * The desktop app of the main-process wiring.
 *
 * @example
 * const desktop = await createApp({ wiring: mainWiring, bridgeSenders: ["app://bundle/"], rendererDir, preload,
 *   dev: null, updateFeed: updateFeed("console") });
 * await desktop.start();
 */
export async function createApp(options: DesktopAppOptions): Promise<DesktopApp> {
  const { container, reporter, wiring } = await bootApp(options.wiring, { env: process.env });
  const { dev, bridgeSenders } = options;
  if (dev?.remoteDebugPort !== undefined)
    app.commandLine.appendSwitch("remote-debugging-port", String(dev.remoteDebugPort));

  const bridges = new Map<string, AnyClass>();
  for (const binding of wiring.bindings ?? [])
    if (binding.kind === "bridge") bridges.set(binding.provide.name, binding.provide);

  const isTrusted = (url: string): boolean =>
    bridgeSenders.some((prefix) => url.startsWith(prefix));
  const windows: BrowserWindow[] = [];

  return {
    windows,
    async start() {
      await app.whenReady();
      const csp = container.has(CspConfig) ? container.get(CspConfig) : buildConfig(CspConfig);
      const policy = contentSecurityPolicy(csp);
      const header = cspHeaderName(csp);
      const { defaultSession } = session;

      defaultSession.webRequest.onHeadersReceived((details, callback) => {
        callback({ responseHeaders: { ...details.responseHeaders, [header]: [policy] } });
      });
      defaultSession.setPermissionRequestHandler((_contents, _permission, callback) =>
        callback(false),
      );
      defaultSession.setPermissionCheckHandler(() => false);

      protocol.handle("app", (request) => {
        const file = bundleFileUrl(request.url, options.rendererDir);
        return file === undefined ? new Response(null, { status: 404 }) : net.fetch(file.href);
      });

      ipcMain.handle(BRIDGE_CHANNEL, async (event, name: unknown, input: unknown) => {
        if (!isTrusted(event.senderFrame?.url ?? ""))
          throw new Error("A bridge call came from a frame outside the app");
        const type = typeof name === "string" ? bridges.get(name) : undefined;
        if (type === undefined) throw new Error(`No bridge is named ${JSON.stringify(name)}`);
        try {
          return await (container.forRequest().get(type) as BridgeInstance).handle(input);
        } catch (error) {
          if (!isRefusal(error)) reporter.report(error);
          throw error;
        }
      });

      app.on("web-contents-created", (_event, contents) => {
        contents.on("will-navigate", (navigation) => {
          if (!isTrusted(navigation.url)) navigation.preventDefault();
        });
        contents.on("will-attach-webview", (attach) => attach.preventDefault());
        contents.setWindowOpenHandler(({ url }) => {
          if (url.startsWith("https:")) void shell.openExternal(url);
          return { action: "deny" };
        });
      });

      app.on("second-instance", () => {
        const [main] = windows;
        if (main === undefined) return;
        if (main.isMinimized()) main.restore();
        main.focus();
      });
      app.on("window-all-closed", () => {
        if (process.platform !== "darwin") app.quit();
      });
      app.on("will-quit", () => {
        void container.close().catch((error: unknown) => reporter.report(error));
      });

      const window = new BrowserWindow({
        show: false,
        webPreferences: {
          preload: fileURLToPath(options.preload),
          contextIsolation: true,
          sandbox: true,
          nodeIntegration: false,
          webSecurity: true,
          webviewTag: false,
        },
      });
      windows.push(window);
      window.once("ready-to-show", () => window.show());
      window.on("closed", () => {
        windows.splice(windows.indexOf(window), 1);
      });
      if (dev?.devtools === true) window.webContents.openDevTools();
      await window.loadURL(dev?.url ?? "app://bundle/");

      if (app.isPackaged && options.updateFeed !== null) {
        autoUpdater.on("error", (error) => reporter.report(error));
        autoUpdater.setFeedURL({ url: options.updateFeed });
        autoUpdater.checkForUpdates();
      }
    },
  };
}
