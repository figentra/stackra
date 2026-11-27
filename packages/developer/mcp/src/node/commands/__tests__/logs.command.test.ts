/**
 * Stackra file contract:
 * Purpose: tests of the `logs` tool through the local MCP: it returns the latest entries oldest first with how many
 *          earlier ones were left out; it narrows by source, lowest level, member (key or folder), time and text; a
 *          bad time or member is a tool error naming the fix; a repository with no dev log says to run `stackra dev`.
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

describe("logs", () => {
  it("says to run stackra dev when there is no dev log yet", async () => {
    const result = await callTool(root, "logs");
    expect(result.isError).toBe(true);
    expect(result.structuredContent.error).toMatchObject({
      message: "No dev log yet at .stackra/logs/dev.ndjson",
      fix: "run `stackra dev` in the member (or at the root), then try again",
    });
  });

  it("returns the latest entries, narrowed by source, level, member, time and text", async () => {
    writeDevLog(root, [
      at(0, {
        source: "server",
        level: "info",
        member: "services/orders",
        stream: "stdout",
        message: "listening",
      }),
      at(1, {
        source: "server",
        level: "debug",
        member: "services/orders",
        stream: "stdout",
        message: "DBG cache",
      }),
      at(2, {
        source: "server",
        level: "warn",
        member: "apps/web",
        stream: "stderr",
        message: "slow HMR",
      }),
      at(3, {
        source: "browser",
        level: "error",
        member: "apps/web",
        kind: "error",
        message: "TypeError: x",
      }),
      at(4, {
        source: "server",
        level: "error",
        member: "services/orders",
        stream: "stderr",
        message: "ERR boom",
      }),
    ]);

    const all = await callTool(root, "logs", { limit: 2 });
    expect(all.isError).toBe(false);
    expect(all.structuredContent.data).toMatchObject({
      file: ".stackra/logs/dev.ndjson",
      entries: [{ message: "TypeError: x" }, { message: "ERR boom" }],
      earlier: 3,
    });

    const messages = async (args: Record<string, unknown>) =>
      (
        ((await callTool(root, "logs", args)).structuredContent.data?.["entries"] ?? []) as {
          message: string;
        }[]
      ).map((entry) => entry.message);
    expect(await messages({ source: "browser" })).toEqual(["TypeError: x"]);
    expect(await messages({ level: "warn" })).toEqual(["slow HMR", "TypeError: x", "ERR boom"]);
    expect(await messages({ member: "orders" })).toEqual(["listening", "DBG cache", "ERR boom"]);
    expect(await messages({ member: "apps/web", level: "error" })).toEqual(["TypeError: x"]);
    expect(await messages({ since: "2026-11-27T02:00:03Z" })).toEqual(["TypeError: x", "ERR boom"]);
    expect(await messages({ search: "boom" })).toEqual(["ERR boom"]);
  });

  it("refuses a time or member it cannot read, naming the fix", async () => {
    writeDevLog(root, [at(0, { source: "server", level: "info", member: ".", message: "x" })]);
    const time = await callTool(root, "logs", { since: "yesterday" });
    expect(time.isError).toBe(true);
    expect(time.structuredContent.error?.fix).toBe(
      "give a span back from now (90s, 15m, 2h, 1d) or an ISO 8601 timestamp",
    );
    const member = await callTool(root, "logs", { member: "billing" });
    expect(member.structuredContent.error?.fix).toBe("name one of: web, orders");
    const level = await callTool(root, "logs", { level: "fatal" });
    expect(level.isError).toBe(true);
  });
});
