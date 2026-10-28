/**
 * Stackra file contract:
 * Purpose: `AccountService`, account state changes (enroll, freeze) and the earn that enrolls on first use, runs the
 *          extension chain, appends to the ledger and records the event; the take-back of points (a refund) and the
 *          credit of a balance imported from another platform. The only code that writes `LoyaltyAccount.tier` at
 *          enrolment or import, and `isFrozen`.
 * Boundary: exported by the module for hosts; runs inside the caller's transaction. `CrudService<LoyaltyAccount>`
 *           supplies every standard read and write; this class adds only `enroll`, `setFrozen`, `earn`, `earnVisit`
 *           (the stamp card: earning by visit count), `takeBack` and `importBalance` (STA-1323). A take-back is one
 *           covered `adjust` debit, cut at the balance so it never overdraws, once per reference; an import is an
 *           `earn` entry of the exact points (no rate, no extension, so it expires like any earn), raises the tier to
 *           the import's and records `points.imported`, not `points.earned`. Events are
 *           recorded on the aggregate and reach the outbox when the unit of work flushes, so a rolled-back change emits
 *           nothing. The extension point is injected as a class and its `earnAdjust` slot called as a method. This is
 *           the one earn path: the pure maths is `LoyaltyService.quoteEarn`, which writes nothing. Both earn paths read
 *           the scope's programme (`LoyaltyKitSettings`): a paused programme earns and enrolls nothing, and the spend
 *           rate is the `earnPerMinor` setting, never config (ADR 0454).
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 13, 16 and 27); ADR 0105 as amended; ADR 0136; ADR 0141; ADR 0265 (the owner
 *                     calls its extension point explicitly); ADR 0454 (decisions 1, 2 and 4); STA-1323.
 */
import type { RequestContext } from "@stackra/actions";
import { type Clock, Enum, type PublicId } from "@stackra/contracts";
import { CrudService } from "@stackra/database";
import type { SettingsReader } from "@stackra/settings";

import { DebitOutcome } from "#contracts/enums/debit-outcome.enum";
import { EntryKind } from "#contracts/enums/entry-kind.enum";
import { LoyaltyTier } from "#contracts/enums/loyalty-tier.enum";
import type { LoyaltyLedger } from "#contracts/ports/loyalty-ledger.port";
import type { EarnRequest } from "#contracts/types/earn-request.type";
import type { MemberId } from "#contracts/types/member-id.type";
import type { PointsImport } from "#contracts/types/points-import.type";
import type { VisitRequest } from "#contracts/types/visit-request.type";
import { IMPORT_REFERENCE_PREFIX } from "#core/constants/import-reference-prefix.constant";
import { MAX_POINTS_PER_ENTRY } from "#core/constants/max-points-per-entry.constant";
import { TAKE_BACK_REFERENCE_PREFIX } from "#core/constants/take-back-reference-prefix.constant";
import { AccountFrozenError } from "#core/errors/account-frozen.error";
import type { LoyaltyService } from "#core/services/loyalty.service";
import { AccountEnrolled } from "#node/events/account-enrolled.event";
import { AccountFrozen } from "#node/events/account-frozen.event";
import { PointsEarned } from "#node/events/points-earned.event";
import { PointsImported } from "#node/events/points-imported.event";
import { PointsTakenBack } from "#node/events/points-taken-back.event";
import type { LoyaltyKitExtensionPoint } from "#node/extensions/loyalty-kit.extension-point";
import { LoyaltyKitSettings } from "#node/loyalty-kit.settings";
import type { LoyaltyAccount } from "#node/models/loyalty-account.model";

/**
 * The account aggregate's write side.
 *
 * @example
 * await this.accounts.earn(memberId(event.customerId), { amountMinor, currency, reference: event.orderId });
 */
export class AccountService extends CrudService<LoyaltyAccount> {
  /** The ledger driver config `ledger` chose. */
  private readonly ledger: LoyaltyLedger;

  /** The base earn maths. */
  private readonly loyalty: LoyaltyService;

  /** The kit's extension point; its `earnAdjust` slot runs extensions in order. */
  private readonly extensions: LoyaltyKitExtensionPoint;

  /** The clock, frozen in tests. */
  private readonly clock: Clock;

  /** The ambient context of the running action, listener or job, handed to the extension chain. */
  private readonly request: RequestContext;

  /** The scope's programme (whether it runs, the earn rate), read per call so a change applies at once. */
  private readonly settings: SettingsReader;

  /**
   * @param ledger - the configured ledger driver, by type.
   * @param loyalty - the base earn maths.
   * @param extensions - the kit's extension point.
   * @param clock - the clock, frozen in tests.
   * @param request - the ambient context of the running call.
   * @param settings - the scope's programme, read per call.
   */
  constructor(
    ledger: LoyaltyLedger,
    loyalty: LoyaltyService,
    extensions: LoyaltyKitExtensionPoint,
    clock: Clock,
    request: RequestContext,
    settings: SettingsReader,
  ) {
    super();
    this.ledger = ledger;
    this.loyalty = loyalty;
    this.extensions = extensions;
    this.clock = clock;
    this.request = request;
    this.settings = settings;
  }

  /**
   * Creates an active account at `tier` and records `account.enrolled`; idempotent per (scope, member) through the
   * unique index, so a second call returns the existing account.
   *
   * @param accountId - the public id the client addressed; absent when the kit enrolls on a first earn.
   */
  async enroll(
    member: MemberId,
    tier: LoyaltyTier,
    accountId?: PublicId<"lac">,
  ): Promise<LoyaltyAccount> {
    const existing = await this.findOne({ memberId: member });
    if (existing) return existing;
    const account = this.create({
      ...(accountId ? { id: accountId } : {}),
      memberId: member,
      tier,
    });
    account.record(AccountEnrolled.create({ accountId: account.id, memberId: member, tier }));
    return account;
  }

  /** Flips the frozen flag and records `account.frozen`; repeating with the same value changes and records nothing. */
  async setFrozen(account: LoyaltyAccount, isFrozen: boolean, at: Date): Promise<void> {
    if (account.isFrozen === isFrozen) return;
    account.isFrozen = isFrozen;
    account.frozenAt = isFrozen ? at : null;
    account.record(
      AccountFrozen.create({ accountId: account.id, memberId: account.memberId, isFrozen }),
    );
  }

  /**
   * Credits a purchase: enrolls the member at bronze on their first earn, takes the base rate, runs the `earnAdjust`
   * chain (the tier multiplier), appends one ledger entry and records `points.earned` v2, which promotes the tier.
   *
   * @returns the points credited; zero for a repeated reference, a sub-point amount or a paused programme.
   * @throws AccountFrozenError when the account is frozen.
   */
  async earn(member: MemberId, request: EarnRequest): Promise<number> {
    const { isActive, earnPerMinor } = await this.settings.get(LoyaltyKitSettings);
    if (!isActive) return 0;
    const account = await this.enroll(member, LoyaltyTier.Bronze);
    if (!account.canTransact) throw AccountFrozenError.create({ accountId: account.id });
    const base = this.loyalty.quoteEarn(request.amount.minor, earnPerMinor);
    const points = await this.extensions.earnAdjust(
      base,
      {
        memberId: member,
        tier: account.tier,
        amount: request.amount,
      },
      this.request.current(),
    );
    if (points <= 0) return 0;
    const written = await this.ledger.append({
      memberId: member,
      points,
      kind: EntryKind.Earn,
      reference: request.reference,
      at: this.clock.now(),
    });
    if (!written) return 0;
    account.record(
      PointsEarned.create({
        memberId: member,
        points,
        reference: request.reference,
        tier: account.tier,
        balanceAfter: await this.ledger.balance(member),
      }),
    );
    return points;
  }

  /**
   * Stamps a visit (earning by visit count): enrolls the member at bronze on their first visit, appends one ledger
   * entry of `request.stamps` points under the visit's reference and records `points.earned`. No spend rate and no
   * extension applies: a stamp card counts visits, not money.
   *
   * @returns the stamps credited; zero for a repeated reference or a paused programme.
   * @throws AccountFrozenError when the account is frozen.
   * @throws RangeError when `request.stamps` is not a positive integer.
   */
  async earnVisit(member: MemberId, request: VisitRequest): Promise<number> {
    if (!Number.isInteger(request.stamps) || request.stamps < 1)
      throw new RangeError(`earnVisit: stamps must be a positive integer, got ${request.stamps}`);
    const { isActive } = await this.settings.get(LoyaltyKitSettings);
    if (!isActive) return 0;
    const account = await this.enroll(member, LoyaltyTier.Bronze);
    if (!account.canTransact) throw AccountFrozenError.create({ accountId: account.id });
    const written = await this.ledger.append({
      memberId: member,
      points: request.stamps,
      kind: EntryKind.Earn,
      reference: request.reference,
      at: this.clock.now(),
    });
    if (!written) return 0;
    account.record(
      PointsEarned.create({
        memberId: member,
        points: request.stamps,
        reference: request.reference,
        tier: account.tier,
        balanceAfter: await this.ledger.balance(member),
      }),
    );
    return request.stamps;
  }

  /**
   * Takes `points` back from the member (a refunded or cancelled purchase) as one covered `adjust` debit under the
   * take-back reference, cut at the balance so it never overdraws: points already spent are the shortfall, never a
   * negative balance. Once per `reference`: a repeat answers what the first call took. A take-back that finds nothing to
   * take still marks the reference, so a retry never takes points earned since.
   *
   * @param reference - the caller's reference (a refund id); the entry is under `TAKE_BACK_REFERENCE_PREFIX`.
   * @returns the points taken, at most `points`; records `points.taken_back` when it took any.
   * @throws RangeError when `points` is not a whole number from 1 to `MAX_POINTS_PER_ENTRY`.
   */
  async takeBack(member: MemberId, points: number, reference: string): Promise<number> {
    if (!Number.isInteger(points) || points < 1 || points > MAX_POINTS_PER_ENTRY)
      throw new RangeError(
        `takeBack: points must be a whole number from 1 to ${MAX_POINTS_PER_ENTRY}, got ${points}`,
      );
    const prefixed = `${TAKE_BACK_REFERENCE_PREFIX}${reference}`;
    for (;;) {
      const done = await this.ledger.find(member, prefixed);
      if (done) return Math.abs(done.points);
      const taken = Math.min(points, Math.max(0, await this.ledger.balance(member)));
      const entry = {
        memberId: member,
        kind: EntryKind.Adjust,
        reference: prefixed,
        at: this.clock.now(),
      };
      if (taken === 0) {
        await this.ledger.append({ ...entry, points: 0 });
        continue; // the next pass answers from the marker, or from a concurrent take-back that won
      }
      const outcome = await this.ledger.debit({ ...entry, points: -taken });
      if (outcome !== DebitOutcome.Written) continue; // uncovered: the balance fell, cut again; duplicate: answer it
      const account = await this.findOne({ memberId: member });
      account?.record(
        PointsTakenBack.create({
          memberId: member,
          points: taken,
          shortfall: points - taken,
          reference,
          balanceAfter: await this.ledger.balance(member),
        }),
      );
      return taken;
    }
  }

  /**
   * Credits a balance imported from another platform: enrolls the member at the import's tier on first use, appends one
   * `earn` entry of exactly `request.points` under the import reference (no earn rate and no extension, and it expires
   * like any earn, counted from the import), raises the account's tier to the import's (never lowers it) and records
   * `points.imported`. Not `points.earned`, so the tier listener does not run. A paused programme still imports: a
   * member never loses points to a pause.
   *
   * @returns the points credited; zero for a repeated reference.
   * @throws AccountFrozenError when the account is frozen.
   * @throws RangeError when `request.points` is not a whole number from 1 to `MAX_POINTS_PER_ENTRY`.
   */
  async importBalance(member: MemberId, request: PointsImport): Promise<number> {
    const { points } = request;
    if (!Number.isInteger(points) || points < 1 || points > MAX_POINTS_PER_ENTRY)
      throw new RangeError(
        `importBalance: points must be a whole number from 1 to ${MAX_POINTS_PER_ENTRY}, got ${points}`,
      );
    const account = await this.enroll(member, request.tier ?? LoyaltyTier.Bronze);
    if (!account.canTransact) throw AccountFrozenError.create({ accountId: account.id });
    const written = await this.ledger.append({
      memberId: member,
      points,
      kind: EntryKind.Earn,
      reference: `${IMPORT_REFERENCE_PREFIX}${request.reference}`,
      at: this.clock.now(),
    });
    if (!written) return 0;
    const ranks = Enum.values(LoyaltyTier); // lowest first
    if (request.tier !== undefined && ranks.indexOf(request.tier) > ranks.indexOf(account.tier))
      account.tier = request.tier;
    account.record(
      PointsImported.create({
        memberId: member,
        points,
        reference: request.reference,
        tier: account.tier,
        balanceAfter: await this.ledger.balance(member),
      }),
    );
    return points;
  }
}
