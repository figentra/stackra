/**
 * Stackra file contract:
 * Purpose: `ApprovalStep`, the step of the approval resolver's fixed order that decided a call: IAM, entitlement and
 *          flag, environment, the permission matrix's off and suggest, the floor, the matrix's other states, the
 *          organisation's policy, the user's preferences, then the default by level.
 * Boundary: a type only; carried on every `ApprovalDecision` so the gateway can say why a call ran, waits or was refused.
 * Runtime: isomorphic
 * Governing contract: ADR 0360 (consequences: the resolver's fixed order).
 */

/** The resolver step that decided. */
export type ApprovalStep =
  | "iam"
  | "entitlement"
  | "environment"
  | "floor"
  | "matrix"
  | "policy"
  | "user"
  | "level";
