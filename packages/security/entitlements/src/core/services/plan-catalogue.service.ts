/**
 * Stackra file contract:
 * Purpose: `PlanCatalogueService`, the mechanism of the plan-catalogue admin: seeds each record from its product seed
 *          pack, takes dated changes as new versions, holds a discount until a second person approves it, and answers
 *          which version a term uses (the one in force at the term's start, so a change reaches a subscriber at
 *          renewal).
 * Boundary: every record kind goes through here (`plan-catalogue`, `price-list`, `offer`, `fee-schedule`,
 *           `rate-card`); the rows are data, checked by each kind's reader before a proposal. No tier, price, offer or
 *           date is named in code. Numbering and state changes of one record run under one lock, so two admins racing
 *           cannot both write version n. The consoles' resources call these methods through OS billing actions.
 * Runtime: isomorphic
 * Governing contract: ADR 0391 (decisions 2 to 5); owner OS-82 (changes at renewal), OS-381 (second approver);
 *                     config-model section 2.
 */
import { Service } from "@stackra/container";
import { Clock, Duration } from "@stackra/contracts";
import { Locks } from "@stackra/locking";

import { CatalogueVersionState } from "#contracts/enums/catalogue-version-state.enum";
import { CatalogueVersions } from "#contracts/ports/catalogue-versions.port";
import type { CatalogueVersion } from "#contracts/types/catalogue-version.type";
import { CatalogueChangeBackdatedError } from "#core/errors/catalogue-change-backdated.error";
import { CatalogueVersionNotPendingError } from "#core/errors/catalogue-version-not-pending.error";
import { SecondApproverRequiredError } from "#core/errors/second-approver-required.error";
import { versionInForce } from "#core/functions/version-in-force.function";
import type { CatalogueProposal } from "#core/types/catalogue-proposal.type";
import type { CatalogueSeedRecord } from "#core/types/catalogue-seed-record.type";

/** How long one record's lock is held at most. */
const HOLD = Duration.seconds(30);

/**
 * The plan-catalogue admin.
 *
 * @example
 * await catalogue.seed(pack.records, "seed-pack:commerce", launchDay);
 * const draft = await catalogue.propose({ key: "offer:founding", kind: "offer", rows, effectiveFrom, discount: true }, rana);
 * await catalogue.approve("offer:founding", draft.version, omar);
 * await catalogue.inForce("price-list:commerce", subscription.currentTermStart);
 */
export class PlanCatalogueService extends Service {
  /** The stored versions. */
  private readonly versions: CatalogueVersions;

  /** The lock store. */
  private readonly locks: Locks;

  /** The current time. */
  private readonly clock: Clock;

  /**
   * @param versions - the stored versions.
   * @param locks - the configured lock store.
   * @param clock - the current time.
   */
  constructor(versions: CatalogueVersions, locks: Locks, clock: Clock) {
    super();
    this.versions = versions;
    this.locks = locks;
    this.clock = clock;
  }

  /**
   * Stores each seed record that has no version yet as its approved version 1, from `effectiveFrom`; a record the
   * admin already holds is left as it is. Returns the keys seeded.
   */
  async seed(
    records: readonly CatalogueSeedRecord[],
    packKey: string,
    effectiveFrom: Date,
  ): Promise<readonly string[]> {
    const seeded: string[] = [];
    for (const record of records)
      await this.locks.with(`catalogue:${record.key}`, HOLD, async () => {
        if ((await this.versions.list(record.key)).length > 0) return;
        await this.versions.save({
          key: record.key,
          kind: record.kind,
          version: 1,
          rows: record.rows,
          effectiveFrom,
          discount: false,
          state: CatalogueVersionState.Approved,
          proposedBy: packKey,
          proposedAt: this.clock.now(),
          decidedBy: packKey,
        });
        seeded.push(record.key);
      });
    return Object.freeze(seeded);
  }

  /**
   * Stores `proposal` as the record's next version: approved at once, or pending a second approver when it is a
   * discount.
   *
   * @throws CatalogueChangeBackdatedError when `effectiveFrom` is before now.
   */
  async propose(proposal: CatalogueProposal, by: string): Promise<CatalogueVersion> {
    const now = this.clock.now();
    if (proposal.effectiveFrom.getTime() < now.getTime())
      throw CatalogueChangeBackdatedError.create({
        key: proposal.key,
        effectiveFrom: proposal.effectiveFrom.toISOString(),
      });
    return this.locks.with(`catalogue:${proposal.key}`, HOLD, async () => {
      const existing = await this.versions.list(proposal.key);
      const version: CatalogueVersion = {
        key: proposal.key,
        kind: proposal.kind,
        version: (existing.at(-1)?.version ?? 0) + 1,
        rows: proposal.rows,
        effectiveFrom: proposal.effectiveFrom,
        discount: proposal.discount,
        state: proposal.discount ? CatalogueVersionState.Pending : CatalogueVersionState.Approved,
        proposedBy: by,
        proposedAt: now,
        ...(proposal.discount ? {} : { decidedBy: by }),
      };
      await this.versions.save(version);
      return version;
    });
  }

  /**
   * Approves a pending discount.
   *
   * @throws CatalogueVersionNotPendingError when the version does not exist or is not pending.
   * @throws SecondApproverRequiredError when `by` proposed it.
   */
  approve(key: string, version: number, by: string): Promise<CatalogueVersion> {
    return this.decide(key, version, by, CatalogueVersionState.Approved);
  }

  /**
   * Rejects a pending discount; its proposer may withdraw it this way.
   *
   * @throws CatalogueVersionNotPendingError when the version does not exist or is not pending.
   */
  reject(key: string, version: number, by: string): Promise<CatalogueVersion> {
    return this.decide(key, version, by, CatalogueVersionState.Rejected);
  }

  /** The version of `key` a term starting at `termStart` uses, or `undefined` when none applies yet. */
  async inForce(key: string, termStart: Date): Promise<CatalogueVersion | undefined> {
    return versionInForce(await this.versions.list(key), termStart);
  }

  /** Every version of `key`, lowest first: the admin's history view. */
  history(key: string): Promise<readonly CatalogueVersion[]> {
    return this.versions.list(key);
  }

  /** Moves a pending version to `state` under the record's lock. */
  private decide(
    key: string,
    version: number,
    by: string,
    state: CatalogueVersionState,
  ): Promise<CatalogueVersion> {
    return this.locks.with(`catalogue:${key}`, HOLD, async () => {
      const found = (await this.versions.list(key)).find((held) => held.version === version);
      if (found?.state !== CatalogueVersionState.Pending)
        throw CatalogueVersionNotPendingError.create({ key, version });
      if (state === CatalogueVersionState.Approved && found.proposedBy === by)
        throw SecondApproverRequiredError.create({ key, version });
      const decided: CatalogueVersion = { ...found, state, decidedBy: by };
      await this.versions.save(decided);
      return decided;
    });
  }
}
