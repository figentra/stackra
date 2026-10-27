/**
 * Stackra file contract:
 * Purpose: `EcrRequestField`, the fields an ECR request can carry, in the order a profile lists them.
 * Boundary: a type in the leaf entry; what each one is called on the wire is the provider's `EcrProfile` (pack data).
 * Runtime: isomorphic
 * Governing contract: ADR 0377 (decisions 1 and 9).
 */

/** A field of a request: the operation code, the merchant reference, the amount and the rest. */
export type EcrRequestField =
  | "operation"
  | "reference"
  | "amount"
  | "currency"
  | "terminal"
  | "provider_ref"
  | "tip_percentages"
  | "tip_custom"
  | "blank";
