/**
 * Stackra file contract:
 * Purpose: proves a prompted field the invocation leaves out is asked for while interactive (text, select, confirm,
 *          with the answer checked like a token), is never asked when its flag or argument is given, takes its default
 *          without a terminal or exits 2 when it has none, and that a value outside a field's choices is refused.
 * Boundary: unit test through the in-process harness.
 * Runtime: node
 * Governing contract: STA-1966 spec FR-018 and EC-04; ADR 0022 (test placement).
 */
// @covers sta-1966:FR-018
import { Int } from "@stackra/validation";

import { Command } from "#core/bases/command.base";
import { Argument } from "#core/decorators/argument.decorator";
import { Option } from "#core/decorators/option.decorator";
import { runCommandForTest } from "#testing/functions/run-command-for-test.function";

/** Creates an app, asking for what it is not given. */
class InitCommand extends Command({
  name: "init",
  description: "Create an app",
}) {
  @Argument({ prompt: "What is it called?" })
  name!: string;

  @Option({
    prompt: "Which template?",
    choices: ["app", "service"],
  })
  template = "app";

  @Option({ prompt: "How many workers?" })
  @Int({ min: 1 })
  workers = 1;

  @Option({ prompt: "Install now?" })
  install = true;

  handle() {
    return {
      name: this.name,
      template: this.template,
      workers: this.workers,
      install: this.install,
    };
  }
}

/** Runs without a terminal, with `--json`. */
const run = (argv: string[]) => runCommandForTest([InitCommand], [...argv, "--json"]);

describe("askMissing", () => {
  it("asks for each left-out prompted field while interactive", async () => {
    const result = await runCommandForTest([InitCommand], ["init"], {
      answers: ["acme", "service", "3", false],
    });
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toMatch(/name \.+ acme/);
    expect(result.stdout).toMatch(/template \.+ service/);
    expect(result.stdout).toMatch(/workers \.+ 3/);
    expect(result.stdout).toMatch(/install \.+ false/);
  });

  it("never asks for a field its flag or argument gives", async () => {
    const result = await runCommandForTest(
      [InitCommand],
      ["init", "acme", "--template", "service", "--workers", "2", "--no-install"],
      { answers: [] },
    );
    expect(result.exitCode).toBe(0);
  });

  it("takes the defaults without a terminal, and exits 2 for a field with none", async () => {
    const given = await run(["init", "acme"]);
    expect(given.json).toEqual({
      ok: true,
      data: { name: "acme", template: "app", workers: 1, install: true },
    });
    const missing = await run(["init"]);
    expect(missing.exitCode).toBe(2);
    expect(missing.json).toMatchObject({ ok: false, error: { code: "non_interactive_prompt" } });
  });

  it("refuses an answer or a value outside the field's rules", async () => {
    // Wide enough that the error box does not wrap the message.
    const refused = await runCommandForTest([InitCommand], ["init"], {
      answers: ["acme", "app", "0"],
      columns: 200,
    });
    expect(refused.exitCode).toBe(1);
    expect(refused.stderr).toContain("--workers must be at least 1");
    const outside = await run(["init", "acme", "--template", "worker"]);
    expect(outside.exitCode).toBe(2);
    expect(outside.json).toMatchObject({
      error: { message: '--template must be one of app, service, got "worker"' },
    });
  });
});
