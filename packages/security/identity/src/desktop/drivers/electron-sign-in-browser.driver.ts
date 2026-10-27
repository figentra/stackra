/**
 * Stackra file contract:
 * Purpose: `ElectronSignInBrowserDriver`, the `SignInBrowser` of the Electron main process: the hosted sign-in opens in
 *          the system browser (`shell.openExternal`) and comes back to a loopback listener on `127.0.0.1` (RFC 8252
 *          section 7.3), which answers the browser with a short page and hands the redirected URL to the PKCE driver.
 * Boundary: main process only. The listener binds `127.0.0.1` alone, on a port drawn at random from the dynamic range
 *           when the driver is made, accepts the configured path only, and closes after the first redirect or after
 *           `IdentityConfig.signInTimeoutMinutes`, which counts as closed (`null`). The code and the state are the PKCE
 *           driver's to check. The page text is the redirect's only output; nothing is logged.
 * Runtime: node
 * Governing contract: ADR 0277 (decisions 1 and 6: loopback with PKCE, desktop the same as the CLI); ADR 0206
 *                     (decision 8); RFC 8252 (sections 7.3 and 8.3).
 */
import { createServer } from "node:http";

import { Driver } from "@stackra/container";
import { shell } from "electron";

import type { IdentityConfig } from "#config/identity.config";
import { SignInBrowser } from "#contracts/index";

/** The dynamic port range (RFC 6335). */
const FIRST_PORT = 49_152;
const PORTS = 65_535 - FIRST_PORT + 1;

/** What the browser shows after the redirect. */
const DONE_PAGE =
  "<!doctype html><meta charset=utf-8><title>Signed in</title><p>You can close this tab.</p>";

/**
 * Signs in through the system browser and a loopback redirect.
 *
 * @example
 * // generated .stackra/desktop/wiring.ts
 * { port: SignInBrowser, candidates: { electron: () => import("@stackra/identity/desktop").then((m) => m.ElectronSignInBrowserDriver) } }
 */
export class ElectronSignInBrowserDriver extends Driver(SignInBrowser) {
  /** The loopback port of this driver. */
  readonly port: number;

  /** The wait for the browser. */
  private readonly config: IdentityConfig;

  /**
   * @param config - the sign-in wait.
   */
  constructor(config: IdentityConfig) {
    super();
    this.config = config;
    this.port = FIRST_PORT + ((crypto.getRandomValues(new Uint32Array(1))[0] ?? 0) % PORTS);
  }

  /** The loopback redirect for `path` (`http://127.0.0.1:53123/auth/callback`). */
  redirectUri(path: string): string {
    return `http://127.0.0.1:${this.port}/${path}`;
  }

  /**
   * Opens `url` in the system browser and waits for the redirect to `redirectUri`.
   *
   * @throws Error when the loopback port cannot be bound.
   */
  authorize(url: string, redirectUri: string): Promise<string | null> {
    const expected = new URL(redirectUri);
    return new Promise<string | null>((resolve, reject) => {
      let timer: ReturnType<typeof setTimeout> | undefined;
      const server = createServer((request, response) => {
        const arrived = new URL(request.url ?? "/", expected.origin);
        if (arrived.pathname !== expected.pathname) {
          response.writeHead(404).end();
          return;
        }
        response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }).end(DONE_PAGE);
        finish(arrived.toString());
      });
      const finish = (answer: string | null): void => {
        clearTimeout(timer);
        server.close();
        resolve(answer);
      };
      server.once("error", reject);
      server.listen(this.port, "127.0.0.1", () => {
        timer = setTimeout(() => finish(null), this.config.signInTimeoutMinutes * 60_000);
        shell.openExternal(url).catch((error: unknown) => {
          clearTimeout(timer);
          server.close();
          reject(error);
        });
      });
    });
  }
}
