/**
 * Stackra file contract:
 * Purpose: `taxBreakdown`, a document's lines summed per tax category, rate and exemption code, in the order each
 *          group first appears.
 * Boundary: a pure function; sums through `Money`, so mixed currencies are a `RangeError`. It never recomputes tax.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decision 9).
 */
import type { FiscalLine } from "#contracts/types/fiscal-line.type";
import type { TaxGroup } from "#core/types/tax-group.type";

/**
 * One group per (category, rate, exemption code).
 *
 * @example
 * taxBreakdown(document.lines).map((group) => group.tax.toDecimal());
 */
export function taxBreakdown(lines: readonly FiscalLine[]): TaxGroup[] {
  const groups = new Map<string, TaxGroup>();
  for (const line of lines) {
    const key = `${line.taxCategory}|${line.taxRate}|${line.exemption?.code ?? ""}`;
    const group = groups.get(key);
    groups.set(
      key,
      group
        ? { ...group, net: group.net.plus(line.net), tax: group.tax.plus(line.tax) }
        : {
            category: line.taxCategory,
            rate: line.taxRate,
            exemption: line.exemption,
            net: line.net,
            tax: line.tax,
          },
    );
  }
  return [...groups.values()];
}
