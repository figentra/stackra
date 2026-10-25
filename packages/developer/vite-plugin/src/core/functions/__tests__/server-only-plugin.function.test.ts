/**
 * Stackra file contract:
 * Purpose: unit tests of `serverOnlyPlugin`: a `.server` specifier fails in the client environment, passes in the
 *          server environment and from a dependency, and ordinary imports are left to Vite.
 * Boundary: test only; calls `resolveId` with a fake plugin context.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0297.
 */
import { describe, expect, it } from "@stackra/testing";

import { serverOnlyPlugin } from "#core/functions/server-only-plugin.function";

/** Resolves `source` from `importer` in an environment of the given consumer. */
function resolve(
  source: string,
  importer: string | undefined,
  consumer: "client" | "server" = "client",
): unknown {
  const resolveId = serverOnlyPlugin().resolveId as (
    this: unknown,
    source: string,
    importer: string | undefined,
  ) => unknown;
  const context = {
    environment: { config: { consumer } },
    error(message: string): never {
      throw new Error(message);
    },
  };
  return resolveId.call(context, source, importer);
}

describe("serverOnlyPlugin", () => {
  it("refuses a .server import in the browser bundle, with or without the extension", () => {
    expect(() => resolve("./orders.server", "/app/src/page.tsx")).toThrow(/server-only/);
    expect(() => resolve("#src/db.server.ts", "/app/src/page.tsx")).toThrow(/server-only/);
    expect(() => resolve("./session.server.tsx?raw", "/app/src/page.tsx")).toThrow(/server-only/);
  });

  it("allows a .server import on the server", () => {
    expect(resolve("./orders.server", "/app/src/page.tsx", "server")).toBeNull();
  });

  it("does not check dependencies or entry points", () => {
    expect(resolve("./x.server", "/app/node_modules/lib/index.js")).toBeNull();
    expect(resolve("./x.server", undefined)).toBeNull();
  });

  it("leaves ordinary imports to Vite", () => {
    expect(resolve("./orders.service", "/app/src/page.tsx")).toBeNull();
    expect(resolve("./server/config", "/app/src/page.tsx")).toBeNull();
  });
});
