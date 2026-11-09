/**
 * Stackra file contract:
 * Purpose: `RECORD_POLICY_RUNNER`, the record-policy check the memory `AccessControl` runs, as
 *          `connectRecordPolicies` last set it.
 * Boundary: process-wide and internal. Unset, the memory driver runs no record policy; `@stackra/iam`'s testing plugin
 *           sets it on every compiled testing app, so a module's tests see its policies refuse.
 * Runtime: isomorphic
 * Governing contract: ADR 0269 (decision 3); ADR 0138 (as amended: the record policy runs inside `handle`).
 */
import type { RecordPolicyRun } from "#core/types/record-policy-run.type";

/** The connected record-policy check. */
export const RECORD_POLICY_RUNNER: { run: RecordPolicyRun | undefined } = { run: undefined };
