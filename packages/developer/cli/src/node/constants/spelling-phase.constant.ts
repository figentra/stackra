/**
 * Stackra file contract:
 * Purpose: `SPELLING_PHASE`, phase 3 of `stackra check`: cspell over the affected files or the whole tree with the
 *          repository's own cspell config, one finding per unknown word.
 * Boundary: starts cspell; skipped when it is not installed. It never edits the dictionary.
 * Runtime: node
 * Governing contract: ADR 0300 (enforced spell checking, en-GB and en).
 */
import { isAbsolute, relative } from "node:path";

import { exitFinding } from "#node/functions/exit-finding.function";
import { runCaptured } from "#node/functions/run-captured.function";
import { toolFinding } from "#node/functions/tool-finding.function";
import type { CheckPhase } from "#node/types/check-phase.type";

/** One cspell issue line: `path:line:col - Unknown word (word)`. */
const ISSUE = /^(.+?):(\d+):(\d+) - (.*)$/;

/** The `spelling` phase. */
export const SPELLING_PHASE: CheckPhase = {
  name: "spelling",
  tool: "cspell",
  adr: "0300",
  async run({ root, files }) {
    if (files !== undefined && files.length === 0) return { findings: [] };
    const output = await runCaptured(
      "cspell",
      [
        "lint",
        "--no-progress",
        "--no-summary",
        "--no-color",
        "--gitignore",
        "--no-must-find-files",
        ...(files ?? ["**"]),
      ],
      root,
    );
    if (output === undefined) return { findings: [], skipped: "not installed" };
    const findings = `${output.stdout}\n${output.stderr}`.split("\n").flatMap((line) => {
      const match = ISSUE.exec(line.trim());
      if (!match) return [];
      const [, file = "", row = "0", column = "0", message = ""] = match;
      const path = isAbsolute(file) ? relative(root, file) : file.replace(/^\.\//, "");
      return [
        toolFinding(SPELLING_PHASE, {
          rule: "unknown-word",
          path,
          line: Number(row),
          column: Number(column),
          message,
        }),
      ];
    });
    if (output.code !== 0 && findings.length === 0)
      return { findings: [exitFinding(SPELLING_PHASE, output)] };
    return { findings };
  },
};
