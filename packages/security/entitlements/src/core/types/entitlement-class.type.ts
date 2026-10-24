/**
 * Stackra file contract:
 * Purpose: `EntitlementClass`, the class `Entitlement({...})` returns and an author extends (`class
 *          ProductLimitEntitlement extends Entitlement({ kind: EntitlementKind.Limit, counts: () => Product }) {}`).
 * Boundary: a type only, one construct signature, so the declaration emit of an author's entitlement names an exported
 *           type (ADR 0305 rule 43). Nobody constructs an entitlement: the class is the reference that sources, usage
 *           counters and gen read its options through.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 25); ADR 0305 (rule 43).
 */
import type { Entitlement } from "#core/bases/entitlement.base";

/** An entitlement class. */
export type EntitlementClass = new () => Entitlement;
