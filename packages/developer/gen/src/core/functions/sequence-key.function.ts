/**
 * Stackra file contract:
 * Purpose: `sequenceKey`, the identity of a gapless sequence: `<module>.` + the written `key` (`billing.invoice`), the
 *          key its counters are stored under and `registerSequences` names.
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: ADR 0342 (decisions 1 and 5); ADR 0294 (decision 20).
 */

/**
 * The key of a sequence class.
 *
 * @example
 * sequenceKey("billing", "invoice"); // "billing.invoice"
 */
export function sequenceKey(module: string, written: string): string {
  return `${module}.${written}`;
}
