/**
 * Stackra file contract:
 * Purpose: `splitTender`, the split of a basket between a restricted tender and the rest: the eligible lines (and their
 *          tax unless the program is tax-exempt) go to the restricted tender up to its balance; everything else, and
 *          any eligible part above the balance with its share of tax, goes to the remainder.
 * Boundary: pure `Money` arithmetic over the eligibility flags `TenderEligibility` returned; no rule, rate or program
 *           is written here. When the balance covers part of the eligible lines of a tax-exempt program, the waived tax
 *           is the eligible tax in proportion, rounded down (the customer never pays less tax than owed).
 * Runtime: isomorphic
 * Governing contract: ADR 0445; R3-SO-08; ADR 0220 (integer minor units).
 */
import { Money } from "@stackra/money";

import type { RestrictedTenderProgram } from "#contracts/types/restricted-tender-program.type";
import type { TenderLine } from "#contracts/types/tender-line.type";
import type { TenderSplit } from "#contracts/types/tender-split.type";

/** `tax` times `paid / net`, rounded down; all of it when `paid` is `net`. */
function shareOf(tax: Money, paid: Money, net: Money): Money {
  if (paid.minor === net.minor) return tax;
  const minor = (BigInt(tax.minor) * BigInt(paid.minor)) / BigInt(net.minor);
  return Money.ofMinor(Number(minor), tax.currency);
}

/**
 * Splits `lines` by `eligible` for `program`.
 *
 * @param balance - what the restricted tender holds, when known; no cap when absent.
 * @throws RangeError when `lines` is empty, `eligible` has a different length, or currencies differ.
 * @example
 * const split = splitTender(snap, lines, [true, false], Money.of("40.00", "USD"));
 */
export function splitTender(
  program: RestrictedTenderProgram,
  lines: readonly TenderLine[],
  eligible: readonly boolean[],
  balance?: Money,
): TenderSplit {
  const first = lines[0];
  if (first === undefined || eligible.length !== lines.length)
    throw new RangeError("splitTender: give one eligibility flag per line, and at least one line");
  const zero = Money.zero(first.unitPrice.currency);
  let total = zero;
  let eligibleNet = zero;
  let eligibleTax = zero;
  const indexes: number[] = [];
  for (const [index, line] of lines.entries()) {
    const net = line.unitPrice.times(line.quantity);
    const tax = line.tax ?? zero;
    total = total.plus(net).plus(tax);
    if (eligible[index] !== true) continue;
    indexes.push(index);
    eligibleNet = eligibleNet.plus(net);
    eligibleTax = eligibleTax.plus(tax);
  }
  const base = program.taxExempt ? eligibleNet : eligibleNet.plus(eligibleTax);
  const cap = balance === undefined ? base : Money.max(balance, zero);
  const restricted = cap.minor < base.minor ? cap : base;
  const waivedTax = program.taxExempt ? shareOf(eligibleTax, restricted, eligibleNet) : zero;
  return {
    program: program.code,
    restricted,
    remainder: total.minus(restricted).minus(waivedTax),
    waivedTax,
    eligible: indexes,
  };
}
