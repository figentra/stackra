/**
 * Stackra file contract:
 * Purpose: unit tests of `writeToolLog`: the log lands at `.stackra/logs/last-<tool>.log` with the command, folder, full
 *          output and exit line, the next run replaces it, a name that is not a plain word cannot leave the folder, and
 *          a root it cannot write gives no path instead of an error.
 * Boundary: test only; a throwaway folder in the OS temp directory.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); STA-2886.
 */
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { writeToolLog } from "#node/functions/write-tool-log.function";

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "stackra-tool-log-"));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

const run = {
  command: "stackra test --tier=unit",
  cwd: "services/commerce",
  exitCode: 1,
  durationMs: 42,
};

describe("writeToolLog", () => {
  it("writes the whole run and replaces it on the next one", async () => {
    await expect(writeToolLog(root, "test", run, "FAIL a\nFAIL b")).resolves.toBe(
      ".stackra/logs/last-test.log",
    );
    expect(readFileSync(join(root, ".stackra/logs/last-test.log"), "utf8")).toBe(
      "$ stackra test --tier=unit\n# in services/commerce\nFAIL a\nFAIL b\n# exit 1 after 42 ms\n",
    );
    await writeToolLog(root, "test", { ...run, exitCode: 0 }, "ok\n");
    expect(readFileSync(join(root, ".stackra/logs/last-test.log"), "utf8")).toBe(
      "$ stackra test --tier=unit\n# in services/commerce\nok\n# exit 0 after 42 ms\n",
    );
  });

  it("keeps a strange name inside the folder", async () => {
    await expect(writeToolLog(root, "../../x", run, "")).resolves.toBe(
      ".stackra/logs/last-______x.log",
    );
    expect(existsSync(join(root, ".stackra/logs/last-______x.log"))).toBe(true);
  });

  it("gives no path when it cannot write", async () => {
    writeFileSync(join(root, ".stackra"), "a file where the folder goes");
    await expect(writeToolLog(root, "test", run, "x")).resolves.toBeUndefined();
  });
});
