/**
 * Stackra file contract:
 * Purpose: the scripted fake agent for dry runs. It calls no model: it copies a prepared solution over the starting
 *   app and reports the counts written in the solution's agent-script.json, so the record shape, the timing and the
 *   acceptance step can be proved without spend.
 * Boundary: reads baselines/<framework>/solutions/<task>/ and writes into the run's working directory; no network.
 * Runtime: node
 * Governing contract: STA-2709 (the owner's method rules).
 * Input: the framework's baseline directory, the task name and the run's working directory.
 * Output: the agent measurements of a run record: tokensIn, tokensOut, toolCalls, wrongEdits, searchCalls,
 *   filesOpened and filesTouched. Tokens are 0.
 * Secrets: none.
 */
import { cpSync, existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const SCRIPT_NAME = "agent-script.json";

export function fakeAgent({ baselineDirectory, task, workdir }) {
  const solution = join(baselineDirectory, "solutions", task);
  if (!existsSync(solution))
    throw new Error(`no scripted solution for ${task} in ${baselineDirectory}`);
  const script = JSON.parse(readFileSync(join(solution, SCRIPT_NAME), "utf8"));
  const filesTouched = readdirSync(solution, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name !== SCRIPT_NAME)
    .map((entry) => join(entry.parentPath, entry.name).slice(solution.length + 1))
    .toSorted();
  for (const file of filesTouched) cpSync(join(solution, file), join(workdir, file));
  return {
    tokensIn: 0,
    tokensOut: 0,
    toolCalls: script.toolCalls,
    wrongEdits: script.wrongEdits,
    searchCalls: script.searchCalls,
    filesOpened: script.filesOpened,
    filesTouched,
  };
}
