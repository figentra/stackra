/**
 * Stackra file contract:
 * Purpose: unit tests of `devLogTee`: it writes a start line, the tool's lines as they complete (a line split across
 *          chunks is one entry, a stack trace takes its error's level), the last partial line and an end line naming
 *          a failing exit code; a dev log that cannot be written is reported once and never throws.
 * Boundary: test only; a temporary repository.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); STA-2889.
 */
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "@stackra/testing";
import { devLogFile, readDevLog } from "@stackra/runway/node";
import { vi } from "vitest";

import { devLogTee } from "#node/functions/dev-log-tee.function";

/** A repository root's dev log. */
function logFile(): string {
  const root = mkdtempSync(join(tmpdir(), "stackra-tee-"));
  writeFileSync(join(root, "pnpm-workspace.yaml"), "packages: []\n");
  return devLogFile(root);
}

describe("devLogTee", () => {
  it("copies the tool's lines into the dev log between a start and an end line", () => {
    const file = logFile();
    const tee = devLogTee(file, "apps/console", "vite --port 5173", vi.fn());
    tee.write("stdout", "  VITE ready\n  ➜  Local: http://local");
    tee.write("stdout", "host:5173/\n");
    tee.write(
      "stderr",
      "TypeError: Cannot read properties of undefined\n    at load (src/a.ts:3:9)\n",
    );
    tee.write("stderr", "last words without a newline");
    tee.end(1);
    expect(
      readDevLog(file).map(({ level, message, stream, member }) => [
        level,
        message,
        stream,
        member,
      ]),
    ).toEqual([
      ["info", "stackra dev: started vite --port 5173", undefined, "apps/console"],
      ["info", "  VITE ready", "stdout", "apps/console"],
      ["info", "  ➜  Local: http://localhost:5173/", "stdout", "apps/console"],
      ["error", "TypeError: Cannot read properties of undefined", "stderr", "apps/console"],
      ["error", "    at load (src/a.ts:3:9)", "stderr", "apps/console"],
      ["info", "last words without a newline", "stderr", "apps/console"],
      ["warn", "stackra dev: vite --port 5173 ended with exit code 1", undefined, "apps/console"],
    ]);
  });

  it("ends with an info line when the tool ends cleanly", () => {
    const file = logFile();
    devLogTee(file, ".", "encore run", vi.fn()).end(0);
    expect(readDevLog(file).at(-1)).toMatchObject({
      level: "info",
      message: "stackra dev: encore run ended",
    });
  });

  it("reports a dev log it cannot write once, and never throws", () => {
    const root = mkdtempSync(join(tmpdir(), "stackra-tee-"));
    // A file where the logs folder should be: every append fails.
    writeFileSync(join(root, ".stackra"), "not a folder");
    const onError = vi.fn();
    const tee = devLogTee(join(root, ".stackra/logs/dev.ndjson"), ".", "vite", onError);
    expect(() => {
      tee.write("stdout", "one\n");
      tee.write("stdout", "two\n");
      tee.end(0);
    }).not.toThrow();
    expect(onError).toHaveBeenCalledTimes(1);
  });
});
