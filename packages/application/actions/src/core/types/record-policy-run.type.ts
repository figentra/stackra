/**
 * Stackra file contract:
 * Purpose: `RecordPolicyRun`, how the memory `AccessControl` asks whether a record's policy lets a call through.
 * Boundary: a type only; `@stackra/iam`'s testing plugin supplies one through `connectRecordPolicies`.
 * Runtime: isomorphic
 * Governing contract: ADR 0269 (decision 3); ADR 0138 (as amended: the record policy runs inside `handle`).
 */
import type { CallDescriptor } from "#contracts/index";

/** Whether the record's policy lets `call` through; `true` when the record has none. */
export type RecordPolicyRun = (call: CallDescriptor, record: object) => Promise<boolean>;
