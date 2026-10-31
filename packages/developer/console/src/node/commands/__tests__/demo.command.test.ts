/**
 * Stackra file contract:
 * Purpose: proves `demo` shows every component without pausing off a terminal and without prompts, stays escape-free
 *          in plain mode, and asks each prompt when interactive.
 * Boundary: unit test with the harness.
 * Runtime: node
 * Governing contract: STA-1730 spec FR-018, FR-021 and FR-024; ADR 0022 (test placement).
 */
// @covers sta-1730:FR-018 sta-1730:FR-024
import { DemoCommand } from "#node/commands/demo.command";
import { runCommandForTest } from "#testing/functions/run-command-for-test.function";

describe("DemoCommand", () => {
  it("shows every component, plain and without prompts off a terminal", async () => {
    const result = await runCommandForTest([DemoCommand], ["demo"]);
    expect(result.exitCode).toBe(0);
    for (const text of [
      "Resolving the workspace",
      "Registry index is current",
      "Uploading",
      "شركة الأمل",
      "Notes",
    ])
      expect(result.stdout).toContain(text);
    expect(result.stdout + result.stderr).not.toContain("\u001B");
    expect(result.asked).toEqual([]);
  });

  it("asks each prompt when interactive", async () => {
    const result = await runCommandForTest([DemoCommand], ["demo", "--json"], {
      answers: ["Ada", "pnpm", ["tests"], "eu-west-1", "secret", true],
    });
    expect(result.json).toEqual({ ok: true, data: { prompts: false } });
    const interactive = await runCommandForTest([DemoCommand], ["demo"], {
      answers: ["Ada", "pnpm", ["tests"], "eu-west-1", "secret", true],
    });
    expect(interactive.asked).toHaveLength(6);
    expect(interactive.stdout).toContain("Thanks, Ada");
    expect(interactive.stdout).not.toContain("secret");
  });
});
