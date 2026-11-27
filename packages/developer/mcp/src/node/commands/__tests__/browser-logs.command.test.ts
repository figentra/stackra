/**
 * Stackra file contract:
 * Purpose: tests of the `browser_logs` tool through the local MCP: it returns only what the pages reported, oldest
 *          first, with the page and stack and without the source and stream; it narrows by kind, level and text and
 *          keeps the latest `limit`.
 * Boundary: test only; a throwaway repository and a dev log written through `appendDevLog`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0282 (decision 5); STA-2889.
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

describe("browser_logs", () => {
  it("returns what the pages reported, narrowed by kind, level and text", async () => {
    const page = "http://localhost:5173/orders";
    writeDevLog(root, [
      at(0, {
        source: "server",
        level: "error",
        member: "services/orders",
        stream: "stderr",
        message: "ERR x",
      }),
      at(1, {
        source: "browser",
        level: "warn",
        member: "apps/web",
        kind: "console",
        message: "slow",
        url: page,
      }),
      at(2, {
        source: "browser",
        level: "error",
        member: "apps/web",
        kind: "error",
        message: "TypeError: boom",
        stack: "TypeError: boom\n    at Orders (http://localhost:5173/src/orders.tsx:4:1)",
        url: page,
      }),
    ]);

    const all = await callTool(root, "browser_logs");
    expect(all.isError).toBe(false);
    expect(all.structuredContent.data).toEqual({
      file: ".stackra/logs/dev.ndjson",
      reports: [
        {
          time: "2026-11-27T02:00:01.000Z",
          level: "warn",
          member: "apps/web",
          kind: "console",
          message: "slow",
          url: page,
        },
        {
          time: "2026-11-27T02:00:02.000Z",
          level: "error",
          member: "apps/web",
          kind: "error",
          message: "TypeError: boom",
          stack: "TypeError: boom\n    at Orders (http://localhost:5173/src/orders.tsx:4:1)",
          url: page,
        },
      ],
      earlier: 0,
    });
    const reports = async (args: Record<string, unknown>) =>
      (
        ((await callTool(root, "browser_logs", args)).structuredContent.data?.["reports"] ??
          []) as { message: string }[]
      ).map((report) => report.message);
    expect(await reports({ kind: "console" })).toEqual(["slow"]);
    expect(await reports({ level: "error" })).toEqual(["TypeError: boom"]);
    expect(await reports({ search: "orders.tsx" })).toEqual(["TypeError: boom"]);
    expect(await reports({ limit: 1 })).toEqual(["TypeError: boom"]);
  });
});
