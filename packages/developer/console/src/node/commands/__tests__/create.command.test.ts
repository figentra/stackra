/**
 * Stackra file contract:
 * Purpose: proves `create` writes the app into a new folder from flags without prompting, asks its questions when
 *          interactive, refuses a folder that is not empty, and returns what it wrote under --json.
 * Boundary: unit test on temporary folders, always with `--no-install` (installing is the f4 verification).
 * Runtime: node
 * Governing contract: STA-1730 spec FR-029 and FR-030; ADR 0022 (test placement).
 */
// @covers sta-1730:FR-029 sta-1730:FR-030
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { CreateCommand } from "#node/commands/create.command";
import { runCommandForTest } from "#testing/functions/run-command-for-test.function";

const scratch = () => mkdtempSync(join(tmpdir(), "sta-1730-create-"));

describe("CreateCommand", () => {
  it("writes the app from flags without asking", async () => {
    const target = join(scratch(), "acme");
    const result = await runCommandForTest(
      [CreateCommand],
      [
        "create",
        target,
        "--name",
        "acme-cli",
        "--bin",
        "acme",
        "--accent",
        "#1E88E5",
        "--no-install",
        "--json",
      ],
    );
    expect(result.exitCode).toBe(0);
    expect(result.json).toMatchObject({ ok: true, data: { name: "acme-cli", bin: "acme" } });
    expect(JSON.parse(readFileSync(join(target, "package.json"), "utf8")).bin).toEqual({
      acme: "./dist/main.js",
    });
    expect(existsSync(join(target, "src/commands/__tests__/greet.command.test.ts"))).toBe(true);
  });

  it("asks for the name, the binary and the accent when interactive", async () => {
    const target = join(scratch(), "demo");
    const result = await runCommandForTest([CreateCommand], ["create", target, "--no-install"], {
      answers: ["demo-cli", "demo", "#647384"],
    });
    expect(result.exitCode).toBe(0);
    expect(result.asked).toEqual([
      "What is the app called?",
      "What do people type to run it?",
      "Which accent colour?",
    ]);
  });

  it("takes the defaults in CI", async () => {
    const target = join(scratch(), "ci-app");
    const result = await runCommandForTest(
      [CreateCommand],
      ["create", target, "--no-install", "--json"],
      { env: { CI: "1" } },
    );
    expect(result.json).toMatchObject({ ok: true, data: { name: "ci-app", bin: "ci-app" } });
  });

  it("refuses a folder that is not empty and writes nothing", async () => {
    const target = scratch();
    writeFileSync(join(target, "keep.txt"), "mine");
    const result = await runCommandForTest(
      [CreateCommand],
      ["create", target, "--name", "x", "--bin", "x", "--accent", "#000000", "--no-install"],
    );
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("is not empty");
    expect(existsSync(join(target, "package.json"))).toBe(false);
  });

  it("refuses a bad accent flag as a usage error", async () => {
    const result = await runCommandForTest(
      [CreateCommand],
      ["create", join(scratch(), "y"), "--accent", "blue"],
    );
    expect(result.exitCode).toBe(2);
  });
});
