/**
 * Stackra file contract:
 * Purpose: proves the harness answers prompts in order, fails naming the prompt when the script runs out or an answer
 *          is refused, captures plain output, and parses a JSON document.
 * Boundary: unit test.
 * Runtime: node
 * Governing contract: STA-1730 spec FR-027 and FR-028; ADR 0022 (test placement).
 */
// @covers sta-1730:FR-027 sta-1730:FR-028
import { Command } from "#core/bases/command.base";
import type { CommandIo } from "#core/types/command-io.type";
import { runCommandForTest } from "#testing/functions/run-command-for-test.function";
import { scriptedPrompter } from "#testing/functions/scripted-prompter.function";

/** Asks two questions. */
class SurveyCommand extends Command({
  name: "survey",
  description: "Ask twice",
}) {
  async handle(io: CommandIo) {
    const name = await io.prompt.text({ message: "Name?" });
    const sure = await io.prompt.confirm({ message: "Sure?" });
    const tools = await io.prompt.multiselect({
      message: "Tools?",
      choices: [{ value: "a" }, { value: "b" }],
    });
    io.output.success(`${name} ${sure ? "yes" : "no"} ${tools.join("+")}`);
    return { name, sure, tools };
  }
}

describe("runCommandForTest", () => {
  it("answers the prompts in order", async () => {
    const result = await runCommandForTest([SurveyCommand], ["survey"], {
      answers: ["Ada", true, ["a", "b"]],
    });
    expect(result).toMatchObject({ exitCode: 0, asked: ["Name?", "Sure?", "Tools?"] });
    expect(result.stdout).toContain("Ada yes a+b");
  });

  it("fails the run naming the prompt when the answers run out", async () => {
    const result = await runCommandForTest([SurveyCommand], ["survey"], { answers: ["Ada"] });
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('No scripted answer is left for "Sure?"');
  });

  it("parses the --json document", async () => {
    const result = await runCommandForTest([SurveyCommand], ["survey", "--json"], { answers: [] });
    expect(result.json).toEqual({
      ok: false,
      error: { code: "non_interactive_prompt", message: 'Cannot ask "Name?" without a terminal' },
    });
  });
});

describe("scriptedPrompter", () => {
  it("refuses a scripted answer the prompt's validate refuses", async () => {
    const prompter = scriptedPrompter(["x"]);
    await expect(
      prompter.ask({ kind: "text", message: "Hex?", validate: () => "Use #rrggbb" }),
    ).rejects.toThrow('The scripted answer to "Hex?" is refused: Use #rrggbb');
  });
});
