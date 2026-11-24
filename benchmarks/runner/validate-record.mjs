/**
 * Stackra file contract:
 * Purpose: check that one benchmark run record has every field of the record shape, with the right type.
 * Boundary: pure; reads no file and no environment.
 * Runtime: node
 * Governing contract: STA-2709 (the owner's method rules).
 * Input: any value, normally a parsed result JSON.
 * Output: a list of problems; an empty list means the record is well formed.
 * Secrets: none. A record never holds a prompt or any credential.
 *
 * The record shape, one field per line:
 *
 * - harnessVersion: version of the harness that produced the record
 * - task: task folder name under benchmarks/tasks, such as "01-add-a-field"
 * - framework: baseline name, such as "stackra" or "nestjs"
 * - frameworkVersion: pinned version of the framework's official starter
 * - model: model id, or "fake-agent" for a scripted dry run
 * - run: run number, from 1
 * - dryRun: true when no model was called
 * - startedAt: ISO 8601 UTC time the run started
 * - wallTimeMs: wall time of the agent step, in milliseconds
 * - tokensIn: input tokens, 0 for a dry run
 * - tokensOut: output tokens, 0 for a dry run
 * - toolCalls: number of tool calls the agent made
 * - filesOpened: paths the agent read, relative to the starting state
 * - filesTouched: paths the agent created or changed, relative to the starting state
 * - acceptance: { passed, failed, total, ok } of the HTTP acceptance tests
 */

const REQUIRED = [
  ["harnessVersion", "string"],
  ["task", "string"],
  ["framework", "string"],
  ["frameworkVersion", "string"],
  ["model", "string"],
  ["run", "number"],
  ["dryRun", "boolean"],
  ["startedAt", "string"],
  ["wallTimeMs", "number"],
  ["tokensIn", "number"],
  ["tokensOut", "number"],
  ["toolCalls", "number"],
  ["filesOpened", "array"],
  ["filesTouched", "array"],
  ["acceptance", "object"],
];

const ACCEPTANCE_NUMBERS = ["passed", "failed", "total"];

const isPlainObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

export function validateRecord(record) {
  if (!isPlainObject(record)) return ["record is not an object"];
  const fields = new Map(Object.entries(record));
  const problems = [];
  for (const [key, type] of REQUIRED) {
    const value = fields.get(key);
    const ok = type === "array" ? Array.isArray(value) : typeof value === type && value !== null;
    if (!ok) problems.push(`${key}: expected ${type}`);
  }
  const acceptance = fields.get("acceptance");
  if (isPlainObject(acceptance)) {
    for (const key of ACCEPTANCE_NUMBERS) {
      if (typeof acceptance[key] !== "number") problems.push(`acceptance.${key}: expected number`);
    }
    if (typeof acceptance.ok !== "boolean") problems.push("acceptance.ok: expected boolean");
  }
  return problems;
}
