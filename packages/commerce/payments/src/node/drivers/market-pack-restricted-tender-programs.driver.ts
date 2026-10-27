/**
 * Stackra file contract:
 * Purpose: `MarketPackRestrictedTenderProgramsDriver`, the production `RestrictedTenderPrograms`: a Market's restricted
 *          tender programs, read from its market pack's `payments.restricted-tenders` list in force today, live entries
 *          only.
 * Boundary: the driver named `market-pack`. It reads the pack through `PaymentPackSource` and `valueOf`, the public API
 *           of `@stackra/market-packs`, and never names a Market or a program. A list entry is an object with `code`
 *           and `ruleSet` (strings), the flags `taxExempt`, `captureAtFulfilment` and `pinEntry` (false when absent)
 *           and an optional `status`; an entry whose status is not `live` (a `planned` program waiting on a
 *           processor) or that lacks a code or rule set is never served. "Today" is the UTC date of the clock.
 * Runtime: node
 * Governing contract: ADR 0445; ADR 0370; R3-SO-08; GRO-182; GRO-186.
 */
import { Driver } from "@stackra/container";
import type { Clock } from "@stackra/contracts";
import { valueOf } from "@stackra/market-packs";

import type { PaymentPackSource } from "#contracts/ports/payment-pack-source.port";
import { RestrictedTenderPrograms } from "#contracts/ports/restricted-tender-programs.port";
import type { RestrictedTenderProgram } from "#contracts/types/restricted-tender-program.type";

/** The pack key that lists a Market's restricted tender programs. */
const PROGRAMS_KEY = "payments.restricted-tenders";

/** The live program of a list entry, or undefined. */
function liveProgramOf(entry: unknown): RestrictedTenderProgram | undefined {
  if (typeof entry !== "object" || entry === null || Array.isArray(entry)) return undefined;
  const field = (name: string): unknown => Reflect.get(entry, name);
  const code = field("code");
  const ruleSet = field("ruleSet");
  const status = field("status");
  if (typeof code !== "string" || code === "" || typeof ruleSet !== "string" || ruleSet === "")
    return undefined;
  if (status !== undefined && status !== "live") return undefined;
  return {
    code,
    ruleSet,
    taxExempt: field("taxExempt") === true,
    captureAtFulfilment: field("captureAtFulfilment") === true,
    pinEntry: field("pinEntry") === true,
  };
}

/**
 * A Market's programs, from its pack.
 *
 * @example
 * const snap = await programs.program("us", "snap");
 */
export class MarketPackRestrictedTenderProgramsDriver extends Driver(RestrictedTenderPrograms) {
  /** The packs. */
  private readonly packs: PaymentPackSource;

  /** Today's date. */
  private readonly clock: Clock;

  /**
   * @param packs - the host's pack source.
   * @param clock - the container's clock.
   */
  constructor(packs: PaymentPackSource, clock: Clock) {
    super();
    this.packs = packs;
    this.clock = clock;
  }

  /** Program `code` as the Market's pack lists it today, live only. */
  async program(market: string, code: string): Promise<RestrictedTenderProgram | undefined> {
    const resolved = await this.packs.resolve(market);
    const today = this.clock.now().toISOString().slice(0, 10);
    const listed = valueOf(resolved, PROGRAMS_KEY, today)?.value;
    if (!Array.isArray(listed)) return undefined;
    for (const entry of listed) {
      const program = liveProgramOf(entry);
      if (program?.code === code) return program;
    }
    return undefined;
  }
}
