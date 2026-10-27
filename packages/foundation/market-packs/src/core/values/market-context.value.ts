/**
 * Stackra file contract:
 * Purpose: `MarketContext`, the verified packs and one tenant's resolve options, answering which resolved market a
 *          rule kind reads for one record: `packFor(record, ruleKind)` looks up the rule kind's subject in the
 *          tenant's own market and resolves the record's market for that subject (the buyer's `us-ca` for sales tax
 *          on a sale a `us-ny` shop ships there, the location's `us-ca-sf` for its tips).
 * Boundary: a value built with `MarketContext.create`, never injected; one per tenant and request, holding no I/O.
 *           Resolutions are cached per market for the life of the value. Refuses with `SubjectMarketMissingError`
 *           when the record lacks the subject's market, and passes on `resolvePack`'s refusals.
 * Runtime: isomorphic
 * Governing contract: ADR 0385 (the subject rule; settles ADR 0363 open question 3); ADR 0370 (decisions 3, 4 and 7);
 *                     ADR 0328 (values are built with `create`).
 */
import { PackSubject } from "#core/enums/pack-subject.enum";
import { SubjectMarketMissingError } from "#core/errors/subject-market-missing.error";
import { resolvePack } from "#core/functions/resolve-pack.function";
import { subjectOf } from "#core/functions/subject-of.function";
import type { MarketPack } from "#core/types/market-pack.type";
import type { MarketRecord } from "#core/types/market-record.type";
import type { ResolveOptions } from "#core/types/resolve-options.type";
import type { ResolvedPack } from "#core/types/resolved-pack.type";

/**
 * Packs per subject for one tenant.
 *
 * @example
 * const context = MarketContext.create(packs, { pins: tenant.packPins, sections: ["restaurant"] });
 * valueOf(context.packFor({ tenant: "us-ny", buyer: "us-ca" }, "tax.sales.rate"), "tax.sales.rate", today);
 */
export class MarketContext {
  /** The verified pack versions. */
  private readonly packs: readonly MarketPack[];

  /** The tenant's pins, accepted statuses and sections. */
  private readonly options: ResolveOptions;

  /** Resolutions already made, by market code. */
  private readonly resolved = new Map<string, ResolvedPack>();

  /**
   * @param packs - the verified pack versions.
   * @param options - the tenant's pins, accepted statuses and sections.
   */
  private constructor(packs: readonly MarketPack[], options: ResolveOptions) {
    this.packs = packs;
    this.options = options;
  }

  /** A context over `packs` with the tenant's `options`. */
  static create(packs: readonly MarketPack[], options: ResolveOptions = {}): MarketContext {
    return new MarketContext(packs, options);
  }

  /**
   * The resolved market `ruleKind` reads for `record`.
   *
   * @throws SubjectMarketMissingError when the record has no market for the rule kind's subject.
   * @throws PackNotFoundError, PackRejectedError from `resolvePack`.
   */
  packFor(record: MarketRecord, ruleKind: string): ResolvedPack {
    const scope = this.resolve(record.scope);
    const subject = subjectOf(scope, ruleKind);
    if (subject === PackSubject.Scope) return scope;
    const market = record[subject];
    if (market === undefined) throw SubjectMarketMissingError.create({ subject, ruleKind });
    return this.resolve(market);
  }

  /** The resolution of `market`, made once. */
  private resolve(market: string): ResolvedPack {
    const cached = this.resolved.get(market);
    if (cached !== undefined) return cached;
    const resolved = resolvePack(this.packs, market, this.options);
    this.resolved.set(market, resolved);
    return resolved;
  }
}
