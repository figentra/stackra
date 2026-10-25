/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./contracts` entry of @stackra/rules (the operator sets: `Operator` and `FieldType`,
 *          the fact source and outcome kind types a consumer registers, and `SeedResult`) until `stackra gen` writes
 *          the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The leaf entry: it imports no other entry of this package
 *           (ADR 0294 decision 15), so IAM may reuse the operator sets without the engine (ADR 0331 decision 11).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); ADR 0331 (decisions 3, 4 and 11); the STA-347 stand-in barrel decision.
 */
export { FieldType } from "#contracts/enums/field-type.enum";
export { Operator } from "#contracts/enums/operator.enum";
export { SeedResult } from "#contracts/enums/seed-result.enum";
export type { FactField } from "#contracts/types/fact-field.type";
export type { FactSource } from "#contracts/types/fact-source.type";
export type { GeoPoint } from "#contracts/types/geo-point.type";
export type { OutcomeKind } from "#contracts/types/outcome-kind.type";
export type { OutcomeParam } from "#contracts/types/outcome-param.type";
