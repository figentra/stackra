/**
 * Stackra file contract:
 * Purpose: `RestrictedTenderPrograms`, the port that answers which restricted tender programs a Market offers and how
 *          each behaves (`RestrictedTenderProgram`).
 * Boundary: an abstract class that is its own token, key `payments.RestrictedTenderPrograms`. The answer is pack data:
 *           the `market-pack` driver (./node) reads the pack key `payments.restricted-tenders`; the `memory` driver
 *           serves tests. This package names no program and no Market. A leaf file.
 * Runtime: isomorphic
 * Governing contract: ADR 0445; ADR 0370; ADR 0294 (decision 16); R3-SO-08.
 */
import { Port } from "@stackra/contracts";

import type { RestrictedTenderProgram } from "#contracts/types/restricted-tender-program.type";

/**
 * A Market's restricted tenders, from data.
 *
 * @example
 * export class MarketPackRestrictedTenderProgramsDriver extends Driver(RestrictedTenderPrograms) { … }
 */
export abstract class RestrictedTenderPrograms extends Port {
  /** Type-only port key. */
  declare readonly "~key": "payments.RestrictedTenderPrograms";

  /**
   * Program `code` as `market` offers it today.
   *
   * @returns undefined when the Market does not offer it (or it is not live).
   */
  abstract program(market: string, code: string): Promise<RestrictedTenderProgram | undefined>;
}
