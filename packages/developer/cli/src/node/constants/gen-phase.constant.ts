/**
 * Stackra file contract:
 * Purpose: `GEN_PHASE`, phase 8 of `stackra check`: `stackra gen --check` in-process at the root (every refusal, the
 *          identity lock and staleness); `--fix` runs `stackra gen` first. One finding per refusal or stale file.
 * Boundary: runs the gen command itself, so the output is gen's own; it never re-implements gen.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 10 and 26); ADR 0295.
 */
import { GEN_COMMAND } from "#node/constants/gen-command.constant";
import { exitFinding } from "#node/functions/exit-finding.function";
import { toolFinding } from "#node/functions/tool-finding.function";
import type { CheckPhase } from "#node/types/check-phase.type";
import type { CliIo } from "#node/types/cli-io.type";

/** A gen refusal: `<member>/<file>[:line:col] error <code> <subject>: <message>`. */
const REFUSAL = /^(\S+?)(?::(\d+):(\d+))? error (\S+) (.*)$/;
/** A stale generated file under `--check`. */
const STALE = /^stale: (\S+)$/;

/** The `gen` phase. */
export const GEN_PHASE: CheckPhase = {
  name: "gen",
  tool: "gen",
  adr: "0294",
  async run({ root, fix, io }) {
    let text = "";
    const capture: CliIo = {
      out: (chunk) => {
        text += chunk;
      },
      err: (chunk) => {
        text += chunk;
      },
      inherit: false,
    };
    const gen = (check: boolean): Promise<number> =>
      GEN_COMMAND.run({
        cwd: root,
        io: capture,
        values: { check },
        positionals: [],
        rest: [],
        cli: async () => 2,
      });
    if (fix) await gen(false);
    text = "";
    const code = await gen(true);
    const findings = text.split("\n").flatMap((line) => {
      const refusal = REFUSAL.exec(line);
      if (refusal) {
        const [, path, row, column, rule = "refusal", message = ""] = refusal;
        return [
          toolFinding(GEN_PHASE, {
            rule,
            path,
            line: row === undefined ? null : Number(row),
            column: column === undefined ? null : Number(column),
            message,
          }),
        ];
      }
      const stale = STALE.exec(line);
      return stale
        ? [
            toolFinding(GEN_PHASE, {
              rule: "stale",
              path: stale[1],
              message:
                "out of date; run `stackra gen` (or `stackra check --fix`) and commit the result",
              fixable: true,
            }),
          ]
        : [];
    });
    if (code !== 0 && findings.length === 0) {
      io.err(text);
      return { findings: [exitFinding(GEN_PHASE, { code, stdout: text, stderr: "" })] };
    }
    return { findings };
  },
};
