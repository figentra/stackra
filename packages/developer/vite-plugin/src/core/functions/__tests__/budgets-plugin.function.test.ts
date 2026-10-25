/**
 * Stackra file contract:
 * Purpose: unit tests of `budgetsPlugin`: entry chunks are held to `entryKb` and other chunks to `routeKb` (gzipped),
 *          every chunk over budget is listed in one failure, assets are ignored, and the plugin applies to client
 *          builds only.
 * Boundary: test only; calls `generateBundle` on a fake bundle of incompressible code.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0295 (decision 5).
 */
import { randomBytes } from "node:crypto";

import { describe, expect, it } from "@stackra/testing";

import { budgetsPlugin } from "#core/functions/budgets-plugin.function";

/** About `kb` kilobytes of code that gzip cannot shrink much. */
function code(kb: number): string {
  return randomBytes(kb * 1024).toString("base64");
}

/** Runs `generateBundle` over `bundle` with a context whose `error` throws. */
function check(bundle: Record<string, unknown>): void {
  const generateBundle = budgetsPlugin({ entryKb: 10, routeKb: 5 }).generateBundle as (
    this: unknown,
    options: unknown,
    bundle: Record<string, unknown>,
  ) => void;
  generateBundle.call(
    {
      error(message: string): never {
        throw new Error(message);
      },
    },
    {},
    bundle,
  );
}

describe("budgetsPlugin", () => {
  it("passes chunks within their budgets", () => {
    expect(() =>
      check({
        "index.js": { type: "chunk", isEntry: true, fileName: "index.js", code: code(4) },
        "route.js": { type: "chunk", isEntry: false, fileName: "route.js", code: code(2) },
      }),
    ).not.toThrow();
  });

  it("fails and lists every chunk over its budget", () => {
    expect(() =>
      check({
        "index.js": { type: "chunk", isEntry: true, fileName: "index.js", code: code(16) },
        "route.js": { type: "chunk", isEntry: false, fileName: "route.js", code: code(8) },
      }),
    ).toThrow(
      /index\.js: [\d.]+ kB gzipped, entry budget 10 kB\nroute\.js: [\d.]+ kB gzipped, route budget 5 kB/,
    );
  });

  it("ignores assets", () => {
    expect(() =>
      check({ "logo.png": { type: "asset", fileName: "logo.png", source: code(64) } }),
    ).not.toThrow();
  });

  it("applies to the client build only", () => {
    const plugin = budgetsPlugin({ entryKb: 10, routeKb: 5 });
    const applies = plugin.applyToEnvironment as (environment: unknown) => boolean;
    expect(plugin.apply).toBe("build");
    expect(applies({ config: { consumer: "client" } })).toBe(true);
    expect(applies({ config: { consumer: "server" } })).toBe(false);
  });
});
