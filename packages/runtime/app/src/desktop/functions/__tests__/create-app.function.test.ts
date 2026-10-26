/**
 * Stackra file contract:
 * Purpose: unit tests of the Electron `createApp`: `start()` opens one hardened window (context isolation, sandbox,
 *          no node integration, web security, no webview, the preload) on `app://bundle/`, adds the CSP header, denies
 *          permissions, serves the bundle, answers bridge calls only from trusted frames and only for bound bridges
 *          (reporting unexpected errors, not refusals), guards navigation and `window.open`, honours the dev values
 *          and checks the update feed when packaged.
 * Boundary: test only; `electron` is mocked with recording fakes.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0295 (decision 8); ADR 0251 (decision 3).
 */
import { Driver } from "@stackra/container";
import type { Wiring } from "@stackra/container";
import { CspConfig } from "@stackra/csp";
import { NotFoundError } from "@stackra/errors";
import { ErrorReporter } from "@stackra/errors/contracts";
import { beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { BRIDGE_CHANNEL } from "#desktop/constants/bridge-channel.constant";
import { createApp } from "#desktop/functions/create-app.function";
import type { DesktopAppOptions } from "#desktop/types/desktop-app-options.type";

/** A recorded listener table. */
type Listeners = Record<string, (...args: never[]) => unknown>;

const electron = vi.hoisted(() => {
  const appListeners: Record<string, (...args: never[]) => unknown> = {};
  const windows: FakeWindow[] = [];

  /** A BrowserWindow that records what it was told. */
  class FakeWindow {
    readonly options: unknown;

    readonly listeners: Record<string, (...args: never[]) => unknown> = {};

    readonly loadURL = vi.fn(() => Promise.resolve());

    readonly show = vi.fn();

    readonly focus = vi.fn();

    readonly restore = vi.fn();

    readonly isMinimized = vi.fn(() => false);

    readonly webContents = { openDevTools: vi.fn() };

    constructor(options: unknown) {
      this.options = options;
      windows.push(this);
    }

    once(event: string, listener: (...args: never[]) => unknown) {
      this.listeners[event] = listener;
    }

    on(event: string, listener: (...args: never[]) => unknown) {
      this.listeners[event] = listener;
    }
  }

  return {
    appListeners,
    windows,
    FakeWindow,
    app: {
      isPackaged: false,
      whenReady: vi.fn(() => Promise.resolve()),
      on: vi.fn((event: string, listener: (...args: never[]) => unknown) => {
        appListeners[event] = listener;
      }),
      quit: vi.fn(),
      commandLine: { appendSwitch: vi.fn() },
    },
    autoUpdater: { on: vi.fn(), setFeedURL: vi.fn(), checkForUpdates: vi.fn() },
    ipcMain: { handle: vi.fn() },
    net: { fetch: vi.fn((href: string) => Promise.resolve(new Response(href))) },
    protocol: { handle: vi.fn() },
    session: {
      defaultSession: {
        webRequest: { onHeadersReceived: vi.fn() },
        setPermissionRequestHandler: vi.fn(),
        setPermissionCheckHandler: vi.fn(),
      },
    },
    shell: { openExternal: vi.fn(() => Promise.resolve()) },
  };
});

vi.mock("electron", () => ({
  app: electron.app,
  autoUpdater: electron.autoUpdater,
  BrowserWindow: electron.FakeWindow,
  ipcMain: electron.ipcMain,
  net: electron.net,
  protocol: electron.protocol,
  session: electron.session,
  shell: electron.shell,
}));

class MemoryErrorReporterDriver extends Driver(ErrorReporter) {
  static readonly errors: unknown[] = [];

  report(error: unknown): void {
    MemoryErrorReporterDriver.errors.push(error);
  }
}

class PrintReceiptBridge {
  handle(input: unknown): unknown {
    const { orderId } = input as { readonly orderId: string };
    if (orderId === "missing") throw NotFoundError.create();
    if (orderId === "jam") throw new Error("printer jammed");
    return { printed: orderId };
  }
}

const wiring: Wiring = {
  member: "@acme/console",
  root: "console",
  modules: { console: { exports: [], dependsOn: [] } },
  bindings: [{ module: "console", kind: "bridge", provide: PrintReceiptBridge }],
  config: [{ key: "csp", provide: CspConfig }],
  drivers: [
    {
      port: ErrorReporter,
      candidates: { memory: () => Promise.resolve(MemoryErrorReporterDriver) },
    },
  ],
};

const options: DesktopAppOptions = {
  wiring,
  bridgeSenders: ["app://bundle/"],
  rendererDir: new URL("file:///Applications/Acme.app/renderer/"),
  preload: new URL("file:///Applications/Acme.app/main/preload.cjs"),
  dev: null,
  updateFeed: null,
};

/** The last call's handler registered on `mock`. */
const handlerOf = <T>(
  mock: { readonly mock: { readonly calls: readonly unknown[][] } },
  index = 0,
): T => mock.mock.calls.at(-1)?.[index] as T;

/** The bridge handler `start()` registered. */
const bridgeHandler = () =>
  handlerOf<(event: unknown, name: unknown, input: unknown) => Promise<unknown>>(
    electron.ipcMain.handle,
    1,
  );

describe("createApp (desktop)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    electron.windows.length = 0;
    electron.app.isPackaged = false;
    MemoryErrorReporterDriver.errors.length = 0;
  });

  it("opens one hardened window on the bundle", async () => {
    const desktop = await createApp(options);
    await desktop.start();
    expect(desktop.windows).toHaveLength(1);
    const window = electron.windows[0];
    if (window === undefined) throw new Error("no window opened");
    expect(window.options).toEqual({
      show: false,
      webPreferences: {
        preload: "/Applications/Acme.app/main/preload.cjs",
        contextIsolation: true,
        sandbox: true,
        nodeIntegration: false,
        webSecurity: true,
        webviewTag: false,
      },
    });
    expect(window.loadURL).toHaveBeenCalledWith("app://bundle/");
    (window.listeners["ready-to-show"] as () => void)();
    expect(window.show).toHaveBeenCalled();
    (window.listeners["closed"] as () => void)();
    expect(desktop.windows).toHaveLength(0);
  });

  it("adds the CSP header and denies every permission", async () => {
    await (await createApp(options)).start();
    const onHeaders = handlerOf<(details: object, callback: (response: object) => void) => void>(
      electron.session.defaultSession.webRequest.onHeadersReceived,
    );
    const callback = vi.fn();
    onHeaders({ responseHeaders: { "x-a": ["1"] } }, callback);
    const [response] = callback.mock.calls[0] as [{ responseHeaders: Record<string, string[]> }];
    const headers = response.responseHeaders;
    expect(headers["x-a"]).toEqual(["1"]);
    expect(headers["Content-Security-Policy"]?.[0]).toContain("default-src");
    const request = handlerOf<(c: unknown, p: string, cb: (ok: boolean) => void) => void>(
      electron.session.defaultSession.setPermissionRequestHandler,
    );
    const decide = vi.fn();
    request({}, "camera", decide);
    expect(decide).toHaveBeenCalledWith(false);
    expect(
      handlerOf<() => boolean>(electron.session.defaultSession.setPermissionCheckHandler)(),
    ).toBe(false);
  });

  it("serves the bundle and answers 404 elsewhere", async () => {
    await (await createApp(options)).start();
    const serve = handlerOf<(request: Request) => Promise<Response> | Response>(
      electron.protocol.handle,
      1,
    );
    await serve(new Request("app://bundle/assets/app.js"));
    expect(electron.net.fetch).toHaveBeenCalledWith(
      "file:///Applications/Acme.app/renderer/assets/app.js",
    );
    expect((await serve(new Request("app://evil/x"))).status).toBe(404);
  });

  it("answers a trusted bridge call on the bridge channel", async () => {
    await (await createApp(options)).start();
    expect(electron.ipcMain.handle).toHaveBeenCalledWith(BRIDGE_CHANNEL, expect.any(Function));
    const event = { senderFrame: { url: "app://bundle/orders" } };
    await expect(
      bridgeHandler()(event, "PrintReceiptBridge", { orderId: "ord_1" }),
    ).resolves.toEqual({
      printed: "ord_1",
    });
  });

  it("refuses an untrusted frame and an unknown bridge", async () => {
    await (await createApp(options)).start();
    await expect(
      bridgeHandler()({ senderFrame: { url: "https://evil.example/" } }, "PrintReceiptBridge", {}),
    ).rejects.toThrow(/outside the app/);
    await expect(
      bridgeHandler()({ senderFrame: { url: "app://bundle/" } }, "DeleteEverythingBridge", {}),
    ).rejects.toThrow(/DeleteEverythingBridge/);
  });

  it("reports an unexpected bridge error but not a refusal", async () => {
    await (await createApp(options)).start();
    const event = { senderFrame: { url: "app://bundle/" } };
    await expect(
      bridgeHandler()(event, "PrintReceiptBridge", { orderId: "missing" }),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(MemoryErrorReporterDriver.errors).toEqual([]);
    await expect(bridgeHandler()(event, "PrintReceiptBridge", { orderId: "jam" })).rejects.toThrow(
      "printer jammed",
    );
    expect(MemoryErrorReporterDriver.errors).toHaveLength(1);
  });

  it("guards navigation and window.open", async () => {
    await (await createApp(options)).start();
    const contents: { listeners: Listeners; openHandler?: (details: { url: string }) => unknown } =
      {
        listeners: {},
      };
    const fakeContents = {
      on: (event: string, listener: (...args: never[]) => unknown) => {
        contents.listeners[event] = listener;
      },
      setWindowOpenHandler: (handler: (details: { url: string }) => unknown) => {
        contents.openHandler = handler;
      },
    };
    (electron.appListeners["web-contents-created"] as (event: unknown, contents: unknown) => void)(
      {},
      fakeContents,
    );
    const away = { url: "https://evil.example/", preventDefault: vi.fn() };
    (contents.listeners["will-navigate"] as (event: typeof away) => void)(away);
    expect(away.preventDefault).toHaveBeenCalled();
    const inside = { url: "app://bundle/settings", preventDefault: vi.fn() };
    (contents.listeners["will-navigate"] as (event: typeof inside) => void)(inside);
    expect(inside.preventDefault).not.toHaveBeenCalled();
    const webview = { preventDefault: vi.fn() };
    (contents.listeners["will-attach-webview"] as (event: typeof webview) => void)(webview);
    expect(webview.preventDefault).toHaveBeenCalled();
    expect(contents.openHandler?.({ url: "https://docs.example/" })).toEqual({ action: "deny" });
    expect(electron.shell.openExternal).toHaveBeenCalledWith("https://docs.example/");
    expect(contents.openHandler?.({ url: "file:///etc/passwd" })).toEqual({ action: "deny" });
    expect(electron.shell.openExternal).toHaveBeenCalledOnce();
  });

  it("loads the dev origin with the dev values", async () => {
    const desktop = await createApp({
      ...options,
      bridgeSenders: ["app://bundle/", "http://localhost:5173/"],
      dev: { url: "http://localhost:5173", devtools: true, remoteDebugPort: 9222 },
    });
    expect(electron.app.commandLine.appendSwitch).toHaveBeenCalledWith(
      "remote-debugging-port",
      "9222",
    );
    await desktop.start();
    const [window] = electron.windows;
    expect(window?.loadURL).toHaveBeenCalledWith("http://localhost:5173");
    expect(window?.webContents.openDevTools).toHaveBeenCalled();
  });

  it("checks the update feed only when packaged", async () => {
    await (
      await createApp({ ...options, updateFeed: "https://feed.example/console/stable/" })
    ).start();
    expect(electron.autoUpdater.checkForUpdates).not.toHaveBeenCalled();
    electron.app.isPackaged = true;
    await (
      await createApp({ ...options, updateFeed: "https://feed.example/console/stable/" })
    ).start();
    expect(electron.autoUpdater.setFeedURL).toHaveBeenCalledWith({
      url: "https://feed.example/console/stable/",
    });
    expect(electron.autoUpdater.checkForUpdates).toHaveBeenCalledOnce();
  });
});
