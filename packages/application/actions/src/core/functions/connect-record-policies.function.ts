/**
 * Stackra file contract:
 * Purpose: `connectRecordPolicies`, how the package that owns record policies hands the memory `AccessControl` its
 *          check, so `ctx.authorize(record)` refuses in a module's tests as it does at run time.
 * Boundary: process-wide: the last call wins, and `undefined` disconnects it. `@stackra/iam`'s testing plugin calls it;
 *           this package never imports `@stackra/iam`.
 * Runtime: isomorphic
 * Governing contract: ADR 0269 (decision 3); ADR 0138 (as amended: the record policy runs inside `handle`).
 */
import { RECORD_POLICY_RUNNER } from "#core/constants/record-policy-runner.constant";
import type { RecordPolicyRun } from "#core/types/record-policy-run.type";

/**
 * Connects the record-policy check the memory `AccessControl` runs.
 *
 * @example
 * connectRecordPolicies(async (call, record) => policyAllows(call, record));
 */
export function connectRecordPolicies(run: RecordPolicyRun | undefined): void {
  RECORD_POLICY_RUNNER.run = run;
}
