/**
 * Stackra file contract:
 * Purpose: tests of the `last_error` tool through the local MCP: it returns the latest error's first line, every line
 *          of a stack printed line by line, the lines its member printed before (up to `context`) and after; lines of
 *          another member or stream never join the error; a browser report is an error of its own with its page and
 *          stack; it narrows by source and member; with no error it says so.
 * Boundary: test only; a throwaway repository and a dev log written through `appendDevLog`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0282 (decision 5: explain failures); STA-2889.
 */
import { rmSync } from "node:fs";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { devLogFixture } from "#node/commands/__tests__/dev-log-repository.fixture";

const { at, callTool, devLogRepository, writeDevLog } = devLogFixture;

let root: string;

beforeEach(() => {
  root = devLogRepository();
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

/** A server line of the orders service on stderr. */
const orders = (seconds: number, level: "info" | "error", message: string) =>
  at(seconds, { source: "server", level, member: "services/orders", stream: "stderr", message });

describe("last_error", () => {
  it("returns the latest server error with its whole stack and the lines around it", async () => {
    writeDevLog(root, [
      orders(0, "info", "INF request started path=/orders"),
      orders(1, "info", "INF loading the order"),
      orders(9, "error", "ERR an older failure"),
      orders(10, "info", "INF request started path=/orders/7"),
      orders(11, "error", "TypeError: Cannot read properties of undefined (reading 'total')"),
      at(11, {
        source: "server",
        level: "info",
        member: "apps/web",
        stream: "stdout",
        message: "hmr update",
      }),
      orders(11, "error", "    at price (src/orders/price.ts:12:5)"),
      orders(11, "error", "    at handler (src/orders/get.ts:30:9)"),
      orders(12, "info", "INF request finished code=internal"),
    ]);

    const result = await callTool(root, "last_error", { context: 2 });
    expect(result.isError).toBe(false);
    expect(result.structuredContent.data).toMatchObject({
      file: ".stackra/logs/dev.ndjson",
      error: {
        source: "server",
        member: "services/orders",
        level: "error",
        message: "TypeError: Cannot read properties of undefined (reading 'total')",
        time: "2026-11-27T02:00:11.000Z",
      },
      lines: [
        "TypeError: Cannot read properties of undefined (reading 'total')",
        "    at price (src/orders/price.ts:12:5)",
        "    at handler (src/orders/get.ts:30:9)",
      ],
      before: [
        { message: "ERR an older failure" },
        { message: "INF request started path=/orders/7" },
      ],
      after: [{ message: "INF request finished code=internal" }],
    });
    const none = await callTool(root, "last_error", { context: 0 });
    expect(none.structuredContent.data?.["before"]).toEqual([]);
  });

  it("returns a browser report as its own error, and narrows by source and member", async () => {
    writeDevLog(root, [
      orders(0, "error", "ERR db down"),
      at(5, {
        source: "browser",
        level: "error",
        member: "apps/web",
        kind: "rejection",
        message: "Unhandled rejection: Error: 500 from /orders",
        stack: "Error: 500 from /orders\n    at load (http://localhost:5173/src/orders.tsx:9:3)",
        url: "http://localhost:5173/orders",
      }),
    ]);
    const latest = await callTool(root, "last_error");
    expect(latest.structuredContent.data).toMatchObject({
      error: { source: "browser", kind: "rejection", url: "http://localhost:5173/orders" },
    });
    expect(latest.structuredContent.data?.["lines"]).toBeUndefined();
    const server = await callTool(root, "last_error", { source: "server" });
    expect(server.structuredContent.data).toMatchObject({ error: { message: "ERR db down" } });
    const web = await callTool(root, "last_error", { member: "web", source: "server" });
    expect(web.structuredContent.data).toEqual({
      file: ".stackra/logs/dev.ndjson",
      error: null,
      checked: 0,
    });
  });

  it("returns the latest of several browser reports a page sent together, never merging them", async () => {
    const page = { source: "browser", level: "error", member: "apps/web" } as const;
    writeDevLog(root, [
      at(1, { ...page, kind: "console", message: "call failed" }),
      at(1, {
        ...page,
        kind: "rejection",
        message: "Unhandled rejection: Error: orders request was rejected",
      }),
      at(1, {
        ...page,
        kind: "error",
        message: "TypeError: Cannot read properties of undefined (reading 'total')",
      }),
    ]);
    const latest = await callTool(root, "last_error");
    expect(latest.structuredContent.data).toMatchObject({
      error: {
        kind: "error",
        message: "TypeError: Cannot read properties of undefined (reading 'total')",
      },
    });
    expect(latest.structuredContent.data?.["lines"]).toBeUndefined();
    const before = (latest.structuredContent.data?.["before"] ?? []) as { message: string }[];
    expect(before.map(({ message }) => message)).toEqual([
      "call failed",
      "Unhandled rejection: Error: orders request was rejected",
    ]);
  });

  it("says there is no error when the log holds none", async () => {
    writeDevLog(root, [orders(0, "info", "INF all good")]);
    const result = await callTool(root, "last_error");
    expect(result.structuredContent.data).toEqual({
      file: ".stackra/logs/dev.ndjson",
      error: null,
      checked: 1,
    });
  });
});
