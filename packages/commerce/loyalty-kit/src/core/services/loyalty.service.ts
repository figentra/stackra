/**
 * Stackra file contract:
 * Purpose: `LoyaltyService`, the earning and redemption rules: how many points an amount earns, how much a balance may
 *          take off a total, and the hold, settle and release of points a purchase spends.
 * Boundary: generic maths over the `LoyaltyLedger` and `LoyaltyMembers` ports; no knowledge of orders or of any
 *           product. It never writes an earn: crediting a purchase is `AccountService.earn`, which enrolls, runs the
 *           extension chain and records the event. Exported by `LoyaltyKitModule` for hosts to inject by class.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 15, 16 and 17); ADR 0220 (integer minor units).
 */
import { Service } from "@stackra/container";

import type { LoyaltyKitConfig } from "#config/loyalty-kit.config";
import { DebitOutcome } from "#contracts/enums/debit-outcome.enum";
import { EntryKind } from "#contracts/enums/entry-kind.enum";
import type { LoyaltyLedger } from "#contracts/ports/loyalty-ledger.port";
import type { LoyaltyMembers } from "#contracts/ports/loyalty-members.port";
import type { MemberId } from "#contracts/types/member-id.type";
import type { RedemptionQuote } from "#contracts/types/redemption-quote.type";
import { HOLD_REFERENCE_PREFIX } from "#core/constants/hold-reference-prefix.constant";
import { RELEASE_REFERENCE_PREFIX } from "#core/constants/release-reference-prefix.constant";
import { SETTLE_REFERENCE_PREFIX } from "#core/constants/settle-reference-prefix.constant";
import { InsufficientPointsError } from "#core/errors/insufficient-points.error";
import { NotAMemberError } from "#core/errors/not-a-member.error";

/**
 * The kit's public service. Inject it by class in any module of the host.
 *
 * @example
 * constructor(loyalty: LoyaltyService) { super(); this.loyalty = loyalty; }
 * const { amountMinor } = await this.loyalty.quote(member, requestedPoints, runningTotalMinor);
 */
export class LoyaltyService extends Service {
  /** The ledger driver config `ledger` chose. */
  private readonly ledger: LoyaltyLedger;

  /** The host's membership answers. */
  private readonly members: LoyaltyMembers;

  /** The resolved configuration, the host's override included. */
  private readonly config: LoyaltyKitConfig;

  /**
   * @param ledger - the port; the driver is chosen by config `ledger`.
   * @param members - implemented by the host, never by the kit.
   * @param config - the resolved config class, the host's override included.
   */
  constructor(ledger: LoyaltyLedger, members: LoyaltyMembers, config: LoyaltyKitConfig) {
    super();
    this.ledger = ledger;
    this.members = members;
    this.config = config;
  }

  /**
   * Largest redemption allowed for `requested` points against `totalMinor`: never more than the balance, never more
   * than `maxRedeemPercent` of the total, converted at `pointValueMinor`. Reads only; nothing is held.
   *
   * @param totalMinor - the amount still to pay at this point of the adjustment chain, in minor units.
   * @returns zero points and zero amount when the member has no balance or the cap rounds to nothing.
   */
  async quote(member: MemberId, requested: number, totalMinor: number): Promise<RedemptionQuote> {
    const balance = await this.ledger.balance(member);
    const capMinor = Math.floor((totalMinor * this.config.maxRedeemPercent) / 100);
    const points = Math.max(
      0,
      Math.min(requested, balance, Math.floor(capMinor / this.config.pointValueMinor)),
    );
    return { points, amountMinor: points * this.config.pointValueMinor };
  }

  /**
   * The base points an amount earns before any extension runs: floor(amountMinor × earnPerMinor). Pure maths: no
   * ledger read, no write, no tier; `AccountService.earn` applies the tier multiplier and credits the result.
   *
   * @returns zero for a sub-point amount.
   */
  quoteEarn(amountMinor: number): number {
    return Math.floor(amountMinor * this.config.earnPerMinor);
  }

  /**
   * Refuses a redemption the member cannot make; an early read used by verify extensions before anything is reserved.
   * Not a guarantee under concurrency: `hold` is the atomic check.
   *
   * @throws NotAMemberError when the principal is not enrolled.
   * @throws InsufficientPointsError when `points` exceeds the balance.
   */
  async assertCanRedeem(member: MemberId, points: number): Promise<void> {
    if (!(await this.members.isMember(member)))
      throw NotAMemberError.create({ principalId: member });
    const balance = await this.ledger.balance(member);
    if (points > balance) throw InsufficientPointsError.create({ balance, requested: points });
  }

  /** The whole points an amount of a redemption stands for, at `pointValueMinor`. */
  pointsFor(amountMinor: number): number {
    return Math.floor(amountMinor / this.config.pointValueMinor);
  }

  /**
   * Reserves `points` for `reference` (an order id) before the purchase commits: one covered debit, atomic with every
   * other debit of the member, so two concurrent purchases can never spend the same points. Run it in the purchase's
   * own transaction, so a refused or rolled-back purchase leaves no hold. A repeated call for the same reference holds
   * nothing more.
   *
   * @throws NotAMemberError when the principal is not enrolled.
   * @throws InsufficientPointsError when the balance, holds included, does not cover `points`.
   */
  async hold(member: MemberId, points: number, reference: string, at: Date): Promise<void> {
    if (!(await this.members.isMember(member)))
      throw NotAMemberError.create({ principalId: member });
    const outcome = await this.ledger.debit({
      memberId: member,
      points: -points,
      kind: EntryKind.Hold,
      reference: `${HOLD_REFERENCE_PREFIX}${reference}`,
      at,
    });
    if (outcome === DebitOutcome.Uncovered) {
      const balance = await this.ledger.balance(member);
      throw InsufficientPointsError.create({ balance, requested: points });
    }
  }

  /**
   * Settles the hold of `reference` into a redemption once the purchase exists: a `redeem` entry under the reference
   * and a `release` that offsets the hold, so the balance does not move. Balance-neutral, so it commutes with
   * `release`: in either order the points come back exactly once. Repeating it writes nothing more; a hold already
   * released is not settled.
   *
   * @returns the points redeemed; zero when the reference holds nothing or was released.
   */
  async settle(member: MemberId, reference: string, at: Date): Promise<number> {
    const held = await this.ledger.find(member, `${HOLD_REFERENCE_PREFIX}${reference}`);
    if (!held) return 0;
    if (await this.ledger.find(member, `${RELEASE_REFERENCE_PREFIX}${reference}`)) return 0;
    // the redeem first: a crash between the two leaves the member short, never credited twice
    await this.ledger.append({
      memberId: member,
      points: held.points,
      kind: EntryKind.Redeem,
      reference,
      at,
    });
    await this.ledger.append({
      memberId: member,
      points: -held.points,
      kind: EntryKind.Release,
      reference: `${SETTLE_REFERENCE_PREFIX}${reference}`,
      at,
    });
    return -held.points;
  }

  /**
   * Gives the points held for `reference` back when the purchase ends without payment (cancelled, expired, payment
   * refused), settled or not. At most once per reference.
   *
   * @returns the points given back; zero when the reference holds nothing or was released.
   */
  async release(member: MemberId, reference: string, at: Date): Promise<number> {
    const held = await this.ledger.find(member, `${HOLD_REFERENCE_PREFIX}${reference}`);
    if (!held) return 0;
    const written = await this.ledger.append({
      memberId: member,
      points: -held.points,
      kind: EntryKind.Release,
      reference: `${RELEASE_REFERENCE_PREFIX}${reference}`,
      at,
    });
    return written ? -held.points : 0;
  }

  /**
   * Debits `points` once per `reference`, as one covered debit: a concurrent redemption of the same points is refused,
   * never overdrawn.
   *
   * @returns the balance after the debit; unchanged when the reference was already applied.
   * @throws InsufficientPointsError when the balance no longer covers `points`.
   */
  async redeem(member: MemberId, points: number, reference: string, at: Date): Promise<number> {
    const outcome = await this.ledger.debit({
      memberId: member,
      points: -points,
      kind: EntryKind.Redeem,
      reference,
      at,
    });
    const balance = await this.ledger.balance(member);
    if (outcome === DebitOutcome.Uncovered)
      throw InsufficientPointsError.create({ balance, requested: points });
    return balance;
  }
}
