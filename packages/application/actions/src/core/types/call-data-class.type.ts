/**
 * Stackra file contract:
 * Purpose: `CallDataClass`, the data class an action or query handles (`dataClass`): a built-in classification
 *          (`DataClassification.Financial`) or a product's own `DataClass({ key })` class, of which gen records the key.
 * Boundary: a type only; the product class is matched by shape, so this package needs no `@stackra/model`. Gen writes
 *           the key into the call's manifest entry, and the AI gateway routes a run in region by the most sensitive
 *           class among the tools it uses.
 * Runtime: isomorphic
 * Governing contract: ADR 0134 (classification); ADR 0341 (product data classes); STA-2594.
 */
import type { DataClassification } from "@stackra/contracts";

/** A built-in classification, or a declared data class (its static `dataClass.key`). */
export type CallDataClass = DataClassification | { readonly dataClass: { readonly key: string } };
