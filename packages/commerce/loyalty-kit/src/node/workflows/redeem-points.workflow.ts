/**
 * Stackra file contract:
 * Purpose: `RedeemPointsWorkflow`, the steps behind `loyalty_kit.points.redeem`: quote (verify included), debit,
 *          confirm. The debit is undone (credited back) when confirmation never comes. The quote converts and caps at
 *          the scope's `pointValueMinor` and `maxRedeemPercent` settings (STA-1323).
 * Boundary: the public async methods are the steps, run in declaration order; `undoDebit` compensates `debit`; `output`
 *           maps the results to the action's output. Only `confirm` takes `@Step`, because it waits for a signal. Each
 *           step is its own transaction and is idempotent on the run. The run parks before `confirm` until
 *           `ConfirmRedemptionAction` sends `RedemptionConfirmed` for the same member and reference; no step body
 *           waits, so the same graph runs on any engine. When the run parks, the engine answers the starting action at
 *           once with `output` over the results so far, so the caller sees the debit before the wait ends; a timeout
 *           later credits the points back without reaching that caller. Started only by `RedeemPointsAction` through
 *           `ctx.run`.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 6, 16 and 18); ADR 0101; ADR 0151; ADR 0152 (decision 1: `waitFor`); ADR
 *                     0265 as amended (the owner runs its `before` slot); ADR 0454 (decision 4: `points.redeemed` is an
 *                     integration event); STA-1323 (the redemption rates are settings).
 */
import type { SettingsReader } from "@stackra/settings";
import { type Run, Step, type StepContext, Workflow } from "@stackra/workflow";

import { EntryKind } from "#contracts/enums/entry-kind.enum";
import type { LoyaltyLedger } from "#contracts/ports/loyalty-ledger.port";
import { REVERT_REFERENCE_PREFIX } from "#core/constants/revert-reference-prefix.constant";
import { memberId } from "#core/functions/member-id.function";
import type { LoyaltyService } from "#core/services/loyalty.service";
import { PointsRedeemed } from "#node/events/points-redeemed.event";
import type { LoyaltyKitExtensionPoint } from "#node/extensions/loyalty-kit.extension-point";
import { LoyaltyKitSettings } from "#node/loyalty-kit.settings";
import { QuotedRedemption } from "#node/schemas/quoted-redemption.schema";
import type { RedeemPointsInput } from "#node/schemas/redeem-points-input.schema";
import { RedeemPointsOutput } from "#node/schemas/redeem-points-output.schema";
import { RedemptionConfirmed } from "#node/workflows/redemption-confirmed.signal";

/**
 * The run timeout is the confirmation wait plus room for the quote and the debit.
 *
 * @example
 * return ctx.run(RedeemPointsWorkflow, input); // from RedeemPointsAction#handle
 */
export class RedeemPointsWorkflow extends Workflow<RedeemPointsInput>({ timeout: "20m" }) {
  /** The redemption maths and the covered debit. */
  private readonly loyalty: LoyaltyService;

  /** The configured ledger driver, for the undo's credit. */
  private readonly ledger: LoyaltyLedger;

  /** The kit's extension point, whose `redeemVerify` slot runs before the quote. */
  private readonly extensions: LoyaltyKitExtensionPoint;

  /** The scope's programme: the point value and the redemption cap the quote uses. */
  private readonly settings: SettingsReader;

  /**
   * @param loyalty - quotes and debits.
   * @param ledger - credits the points back when the debit is undone.
   * @param extensions - runs the `redeemVerify` slot.
   * @param settings - the scope's redemption rates, read per quote.
   */
  constructor(
    loyalty: LoyaltyService,
    ledger: LoyaltyLedger,
    extensions: LoyaltyKitExtensionPoint,
    settings: SettingsReader,
  ) {
    super();
    this.loyalty = loyalty;
    this.ledger = ledger;
    this.extensions = extensions;
    this.settings = settings;
  }

  /**
   * Runs the `redeemVerify` slot, then the kit's own rules, and quotes; no side effects, so no undo. A `before` slot
   * returns the arguments the step continues with, so an extension may lower the points asked for; the reference stays
   * the caller's.
   *
   * @throws the first extension's refusal, NotAMemberError or InsufficientPointsError.
   */
  async quote(run: Run<this>, ctx: StepContext): Promise<QuotedRedemption> {
    const member = memberId((ctx.actor.onBehalfOf ?? ctx.actor).id);
    const [input] = await this.extensions.redeemVerify(run.input, ctx);
    await this.loyalty.assertCanRedeem(member, input.points);
    const rates = await this.settings.get(LoyaltyKitSettings);
    // the stored input keeps `totalMinor`; the run's currency makes it a MoneyAmount at this boundary
    const total = { minor: input.totalMinor, currency: ctx.currency };
    const quote = await this.loyalty.quote(member, input.points, total, rates);
    return QuotedRedemption.create({
      memberId: member,
      points: quote.points,
      amountMinor: quote.amount.minor,
      reference: run.input.reference,
    });
  }

  /**
   * Takes the points off the ledger as one covered debit, so a redemption that raced this one since the quote is
   * refused here instead of overdrawing; `points.redeemed.v1` reaches the outbox when this step commits.
   *
   * @returns the member's balance after the debit.
   * @throws InsufficientPointsError when the balance no longer covers the quoted points.
   */
  async debit(run: Run<this>, ctx: StepContext): Promise<number> {
    const { memberId: member, points, reference } = run.results.quote;
    const balance = await this.loyalty.redeem(memberId(member), points, reference, ctx.now());
    ctx.record(
      PointsRedeemed.create({ memberId: member, points, reference, balanceAfter: balance }),
    );
    return balance;
  }

  /** Undoes `debit`: an `adjust` entry under the revert reference, so repeating it credits nothing twice. */
  async undoDebit(run: Run<this>, ctx: StepContext): Promise<void> {
    const { memberId: member, points, reference } = run.results.quote;
    await this.ledger.append({
      memberId: memberId(member),
      points,
      kind: EntryKind.Adjust,
      reference: `${REVERT_REFERENCE_PREFIX}${reference}`,
      at: ctx.now(),
    });
  }

  /**
   * Runs once the host confirms: the run parks before this step until `RedemptionConfirmed` arrives for this member and
   * reference, or the 15 minutes pass and the engine undoes `debit`. This wait is what makes the redemption a workflow
   * instead of an action.
   *
   * @returns the confirmation as received, kept in the run record for support.
   */
  @Step<RedeemPointsWorkflow>({
    waitFor: RedemptionConfirmed,
    correlate: (run) => ({
      memberId: run.results.quote.memberId,
      reference: run.results.quote.reference,
    }),
    timeout: "15m",
  })
  async confirm(
    _run: Run<this>,
    _ctx: StepContext,
    confirmed: RedemptionConfirmed,
  ): Promise<RedemptionConfirmed> {
    return confirmed;
  }

  /** The action's output, built from the step results. */
  output(run: Run<this>): RedeemPointsOutput {
    return RedeemPointsOutput.create({
      points: run.results.quote.points,
      amountMinor: run.results.quote.amountMinor,
      balance: run.results.debit,
    });
  }
}
