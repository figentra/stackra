/**
 * Stackra file contract:
 * Purpose: unit tests of `shellCommandLine`: the line quotes literals (quotes, spaces, `$(…)` and backticks stay
 *          inert), expands only `$NAME` from the environment, and fails naming an unset variable. Each case runs the
 *          line through `sh` to prove the round trip.
 * Boundary: test only; runs `/bin/sh` with a throwaway environment holding a dummy value, never a real secret.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0173.
 */
import { spawnSync } from "node:child_process";

import { describe, expect, it } from "@stackra/testing";

import { shellCommandLine } from "#core/functions/shell-command-line.function";

/** The arguments `sh` hands to `printf` after expanding `shellCommandLine`. */
function roundTrip(args: readonly string[], env: Record<string, string> = {}) {
  const line = `${shellCommandLine(["printf", "%s\\n", ...args])}`;
  const result = spawnSync("sh", ["-c", line], {
    env: { PATH: process.env["PATH"] ?? "", ...env },
    encoding: "utf8",
  });
  return {
    status: result.status,
    lines: result.stdout.split("\n").slice(0, -1),
    stderr: result.stderr,
  };
}

describe("shellCommandLine", () => {
  it("quotes literals so the shell passes them unchanged", () => {
    const args = ["it's", "two words", "$(touch pwned)", "`id`", "a;b|c", "", "$lower"];
    expect(roundTrip(args).lines).toEqual(args);
  });

  it("expands a $NAME reference, alone or embedded", () => {
    expect(
      roundTrip(["$DUMMY_TOKEN", "x-token:$DUMMY_TOKEN!"], { DUMMY_TOKEN: "dummy" }).lines,
    ).toEqual(["dummy", "x-token:dummy!"]);
  });

  it("fails naming a variable the store did not set", () => {
    const result = roundTrip(["$MISSING_TOKEN"]);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("MISSING_TOKEN is not set in the secret store");
  });

  it("writes the documented form", () => {
    expect(shellCommandLine(["npx", "--api-key", "$CONTEXT7_API_KEY"])).toBe(
      `'npx' '--api-key' "\${CONTEXT7_API_KEY:?CONTEXT7_API_KEY is not set in the secret store}"`,
    );
  });
});
