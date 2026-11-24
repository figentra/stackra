/**
 * Stackra file contract:
 * Purpose: the file name a run record is saved under in benchmarks/results: harness version, framework and its
 *   version, model id, date, task and run number.
 * Boundary: pure; reads no file and no environment.
 * Runtime: node
 * Governing contract: STA-2709 (the owner's method rules).
 * Input: a run record that passed validateRecord.
 * Output: a file name made only of letters, digits, dot, underscore and dash.
 * Secrets: none.
 */
export function recordFileName(record) {
  const parts = [
    `h${record.harnessVersion}`,
    `${record.framework}-${record.frameworkVersion}`,
    record.model,
    record.startedAt.slice(0, 10),
    record.task,
    `run${record.run}`,
  ];
  return `${parts.join("__").replaceAll(/[^A-Za-z0-9._-]+/g, "-")}.json`;
}
