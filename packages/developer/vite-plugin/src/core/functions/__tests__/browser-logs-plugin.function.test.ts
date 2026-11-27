/**
 * Stackra file contract:
 * Purpose: tests of `browserLogsPlugin` on a real Vite dev server: it applies to `serve` only; Vite's client module
 *          carries the browser log client; a same-origin report lands in the repository's dev log as browser entries,
 *          redacted; a cross-site report, another method and an oversized body are refused and write nothing.
 * Boundary: test only; a throwaway repository in the OS temp directory and a Vite server on a free local port.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0282 (decision 5); STA-2889.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { devLogFile, readDevLog } from "@stackra/runway/node";
import { createServer, type ViteDevServer } from "vite";

import { BROWSER_LOG_LIMITS } from "#core/constants/browser-log-limits.constant";
import { BROWSER_LOG_ROUTE } from "#core/constants/browser-log-route.constant";
import { browserLogsPlugin } from "#core/functions/browser-logs-plugin.function";

let root: string;
let server: ViteDevServer;
let origin: string;

beforeEach(async () => {
  root = mkdtempSync(join(tmpdir(), "stackra-browser-log-"));
  writeFileSync(join(root, "pnpm-workspace.yaml"), "packages:\n  - apps/*\n");
  mkdirSync(join(root, "apps/web"), { recursive: true });
  writeFileSync(join(root, "apps/web/index.html"), "<!doctype html><title>web</title>");
  server = await createServer({
    root: join(root, "apps/web"),
    configFile: false,
    logLevel: "silent",
    plugins: [browserLogsPlugin()],
    server: { host: "127.0.0.1", port: 0, strictPort: false },
    optimizeDeps: { noDiscovery: true, include: [] },
  });
  await server.listen();
  const address = server.httpServer?.address();
  origin = `http://127.0.0.1:${typeof address === "object" && address !== null ? address.port : 0}`;
});

afterEach(async () => {
  await server.close();
  rmSync(root, { recursive: true, force: true });
});

/** Posts `body` to the browser log route with `headers` over the default same-origin ones. */
const post = (body: string, headers: Record<string, string> = {}) =>
  fetch(`${origin}${BROWSER_LOG_ROUTE}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-stackra-browser-log": "1",
      origin,
      "sec-fetch-site": "same-origin",
      ...headers,
    },
    body,
  });

describe("browserLogsPlugin", () => {
  it("applies to the dev server only", () => {
    expect(browserLogsPlugin().apply).toBe("serve");
  });

  it("adds the browser log client to Vite's client module", async () => {
    const client = await (await fetch(`${origin}/@vite/client`)).text();
    expect(client).toContain(BROWSER_LOG_ROUTE);
    expect(client).toContain('addEventListener("unhandledrejection"');
  });

  it("writes a same-origin report into the repository's dev log, redacted", async () => {
    const response = await post(
      JSON.stringify({
        entries: [
          {
            kind: "error",
            level: "error",
            message: "TypeError: fetch failed for Bearer abc.def",
            stack: "TypeError\n    at load (http://127.0.0.1/src/main.ts:3:1)",
            url: `${origin}/orders?email=ada@example.com`,
          },
        ],
      }),
    );
    expect(response.status).toBe(204);
    const log = readDevLog(devLogFile(join(root, "apps/web")));
    expect(log).toHaveLength(1);
    expect(log[0]).toMatchObject({
      source: "browser",
      level: "error",
      kind: "error",
      member: "apps/web",
      message: "TypeError: fetch failed for [redacted]",
      url: `${origin}/orders`,
    });
  });

  it("refuses a cross-site report, another method and an oversized body", async () => {
    const entry = JSON.stringify({ entries: [{ kind: "console", level: "warn", message: "x" }] });
    expect(
      (await post(entry, { "sec-fetch-site": "cross-site", origin: "https://evil.example" }))
        .status,
    ).toBe(403);
    expect((await fetch(`${origin}${BROWSER_LOG_ROUTE}`)).status).toBe(405);
    expect((await post("x".repeat(BROWSER_LOG_LIMITS.bodyBytes + 1))).status).toBe(413);
    expect((await post("{not json")).status).toBe(400);
    expect(readDevLog(devLogFile(join(root, "apps/web")))).toEqual([]);
  });
});
