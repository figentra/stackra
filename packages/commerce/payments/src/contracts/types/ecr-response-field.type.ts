/**
 * Stackra file contract:
 * Purpose: `EcrResponseField`, the fields an ECR answer can carry, in the order a profile lists them.
 * Boundary: a type in the leaf entry; what each one is called on the wire is the provider's `EcrProfile` (pack data).
 * Runtime: isomorphic
 * Governing contract: ADR 0377 (decisions 1 and 9).
 */

/** A field of an answer; `blank` is a position the driver skips. */
export type EcrResponseField =
  | "operation"
  | "reference"
  | "result"
  | "provider_ref"
  | "amount"
  | "tip"
  | "blank";
