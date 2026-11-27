/**
 * Stackra file contract:
 * Purpose: unit tests of the dev log: `devLogFile` finds the repository root's log from a member folder;
 *          `appendDevLog` redacts every entry with the logger's rules (a credential field, an email field, a bearer
 *          token and a JWT inside text), cuts an overlong message and stack, creates the folder and rotates a full
 *          file to `dev.1.ndjson`; `readDevLog` reads the rotated file first, then the current one, and skips a
 *          line that is not an entry.
 * Boundary: test only; temporary repositories.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0147 (decision 1); STA-2889.
 */
import { appendFileSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { DEV_LOG_MAX_BYTES } from "#core/constants/dev-log-max-bytes.constant";
import { DEV_LOG_MAX_TEXT } from "#core/constants/dev-log-max-text.constant";
import type { DevLogEntry } from "#core/types/dev-log-entry.type";
import { appendDevLog } from "#node/functions/append-dev-log.function";
import { devLogFile } from "#node/functions/dev-log-file.function";
import { readDevLog } from "#node/functions/read-dev-log.function";

/** A repository root with one member folder. */
function repository(): string {
  const root = mkdtempSync(join(tmpdir(), "dev-log-"));
  writeFileSync(join(root, "pnpm-workspace.yaml"), "packages: []\n");
  mkdirSync(join(root, "apps/console"), { recursive: true });
  return root;
}

/** A server entry with `message`. */
const entry = (message: string, extra: Partial<DevLogEntry> = {}): DevLogEntry => ({
  time: "2026-11-27T02:00:00.000Z",
  source: "server",
  level: "info",
  member: "apps/console",
  message,
  ...extra,
});

describe("devLogFile", () => {
  it("is the repository root's .stackra/logs/dev.ndjson from any member folder", () => {
    const root = repository();
    expect(devLogFile(join(root, "apps/console"))).toBe(join(root, ".stackra/logs/dev.ndjson"));
    expect(devLogFile(root)).toBe(join(root, ".stackra/logs/dev.ndjson"));
  });

  it("is under the folder itself outside a workspace", () => {
    const folder = mkdtempSync(join(tmpdir(), "dev-log-lone-"));
    expect(devLogFile(folder)).toBe(join(folder, ".stackra/logs/dev.ndjson"));
  });
});

describe("appendDevLog", () => {
  it("writes redacted JSON lines, creating the folder", () => {
    const root = repository();
    const file = devLogFile(root);
    appendDevLog(file, [
      entry("GET /orders failed: Authorization: Bearer abc.def-ghi", {
        level: "error",
        fields: { email: "ada@example.com", password: "hunter2", orderId: "ord_1" },
      }),
      entry("token eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.c2lnbmF0dXJl in the page", {
        source: "browser",
      }),
    ]);
    const lines = readFileSync(file, "utf8").trimEnd().split("\n");
    expect(lines).toHaveLength(2);
    const [first, second] = lines.map((line) => JSON.parse(line) as Record<string, unknown>);
    expect(first?.["message"]).toBe("GET /orders failed: Authorization: [redacted]");
    expect(first?.["fields"]).toEqual({
      email: "[redacted]",
      password: "[redacted]",
      orderId: "ord_1",
    });
    expect(second?.["message"]).toBe("token [redacted] in the page");
    expect(readFileSync(file, "utf8")).not.toMatch(/hunter2|ada@example|eyJhbGci|abc\.def/);
  });

  it("cuts an overlong message and stack after redacting them", () => {
    const file = devLogFile(repository());
    appendDevLog(file, [
      entry("x".repeat(DEV_LOG_MAX_TEXT + 10), { stack: "y".repeat(DEV_LOG_MAX_TEXT + 3) }),
    ]);
    const [read] = readDevLog(file);
    expect(read?.message).toBe(`${"x".repeat(DEV_LOG_MAX_TEXT)} … (10 more characters cut)`);
    expect(read?.stack).toBe(`${"y".repeat(DEV_LOG_MAX_TEXT)} … (3 more characters cut)`);
  });

  it("rotates a full file to dev.1.ndjson and keeps appending", () => {
    const file = devLogFile(repository());
    appendDevLog(file, [entry("old")]);
    // Pad the file to the limit, so the next append rotates it.
    appendFileSync(file, `${"#".repeat(DEV_LOG_MAX_BYTES)}\n`);
    appendDevLog(file, [entry("new")]);
    expect(readFileSync(file, "utf8").trimEnd().split("\n")).toHaveLength(1);
    expect(readFileSync(file.replace("dev.ndjson", "dev.1.ndjson"), "utf8")).toContain('"old"');
    expect(readDevLog(file).map((read) => read.message)).toEqual(["old", "new"]);
  });

  it("writes nothing for no entries", () => {
    const file = devLogFile(repository());
    appendDevLog(file, []);
    expect(readDevLog(file)).toEqual([]);
  });
});

describe("readDevLog", () => {
  it("reads the rotated file first and skips a line that is not an entry", () => {
    const file = devLogFile(repository());
    appendDevLog(file.replace("dev.ndjson", "dev.1.ndjson"), [entry("first")]);
    appendDevLog(file, [entry("second")]);
    appendFileSync(file, '{"time":"t","message":"no source"}\nnot json\n{"cut mid-wri');
    appendFileSync(file, "\n");
    appendDevLog(file, [entry("third", { level: "warn" })]);
    expect(readDevLog(file).map((read) => [read.message, read.level])).toEqual([
      ["first", "info"],
      ["second", "info"],
      ["third", "warn"],
    ]);
  });

  it("reads a missing log as no entries", () => {
    expect(readDevLog(devLogFile(repository()))).toEqual([]);
  });
});
