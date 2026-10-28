/**
 * Stackra file contract:
 * Purpose: unit tests of `RedeemPointsWorkflow` on the native engine: the run answers at once with the debit when it
 *          parks on the confirmation; a confirmed redemption keeps its debit past the wait; an unconfirmed one is
 *          credited back under the revert reference when the wait times out; a `redeemVerify` extension may lower the
 *          points asked for; the quote converts and caps at the scope's point value and redemption cap settings.
 * Boundary: test only; the engine runs on the memory journal and lock driver with a clock the test moves, over a real
 *           `LoyaltyService`, the memory ledger, the members fake, a stand-in extension point and a stand-in outbox
 *           that keeps what the debit step writes (`points.redeemed` is an integration event, ADR 0454). No database. The sample's
 *           integration test expected the redeem call itself to refuse with `workflow_timed_out` after the wait; the
 *           engine answers the call when the run parks, so here the call returns the debit and the timeout shows on the
 *           run record and the balance.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0151 (engine conformance); ADR 0152 (decision 1: `waitFor`); ADR 0294
 *                     (decision 18).
 */
import type { ExtensionContext, Resolver } from "@stackra/actions";
import type { AnyClass } from "@stackra/container";
import type { Clock } from "@stackra/contracts";
import { EventOutbox, type RecordedEvent } from "@stackra/events/contracts";
import { actors } from "@stackra/iam/testing";
import { fakeSettings } from "@stackra/settings/testing";
import { Locks, MemoryLockDriver } from "@stackra/locking";
import { describe, expect, it } from "@stackra/testing";
import {
  MemoryWorkflowJournalDriver,
  NativeWorkflowRunnerDriver,
  WorkflowRunStatus,
} from "@stackra/workflow";
import type { RunOrigin } from "@stackra/workflow";

import { EntryKind } from "#contracts/enums/entry-kind.enum";
import { MemoryLoyaltyLedgerDriver } from "#core/drivers/memory-loyalty-ledger.driver";
import { memberId } from "#core/functions/member-id.function";
import { LoyaltyService } from "#core/services/loyalty.service";
import { PointsRedeemed } from "#node/events/points-redeemed.event";
import type { LoyaltyKitExtensionPoint } from "#node/extensions/loyalty-kit.extension-point";
import { LoyaltyKitSettings } from "#node/loyalty-kit.settings";
import { RedeemPointsInput } from "#node/schemas/redeem-points-input.schema";
import { RedeemPointsWorkflow } from "#node/workflows/redeem-points.workflow";
import { RedemptionConfirmed } from "#node/workflows/redemption-confirmed.signal";
import { LoyaltyMembersFake } from "#testing/loyalty-members.fake";
import { pointsEntry } from "#testing/points-entry.fixture";

/** The enrolled customer of every case. */
const CUSTOMER = "usr_01ja0000000000000000000001";

/** The member the ledger knows the customer as. */
const member = memberId(CUSTOMER);

/** When every run starts. */
const START = new Date("2026-10-21T09:00:00Z");

/** `minutes` after the start. */
const plus = (minutes: number): Date => new Date(START.getTime() + minutes * 60_000);

/** The redeem call the run starts from, as the customer. */
const ORIGIN: RunOrigin = {
  callId: "call-1",
  key: "loyalty_kit.points.redeem@1",
  actor: actors.customer(CUSTOMER),
  locale: "en",
  timeZone: "UTC",
  currency: "SAR",
  market: "default",
};

/** A slot that passes its arguments on unchanged. */
const passThrough = async (input: RedeemPointsInput, _ctx: ExtensionContext) => [input];

/** `[name:status]` of each step of `run`. */
const steps = (run: { readonly steps: readonly { name: string; status: string }[] } | undefined) =>
  run?.steps.map((step) => `${step.name}:${step.status}`);

/**
 * An engine running the workflow for a customer holding 1 000 points, with `redeemVerify` as the slot and the scope's
 * redemption rates (the defaults unless given).
 */
async function engineWith(
  redeemVerify = passThrough,
  rates: { pointValueMinor?: number; maxRedeemPercent?: number } = {},
) {
  const clock = {
    at: START,
    now(): Date {
      return new Date(this.at);
    },
  } as Clock & { at: Date };
  const ledger = new MemoryLoyaltyLedgerDriver();
  await ledger.append(pointsEntry.build({ memberId: member, points: 1_000, at: plus(-60) }));
  const loyalty = new LoyaltyService(ledger, LoyaltyMembersFake.with([CUSTOMER]));
  const workflow = new RedeemPointsWorkflow(
    loyalty,
    ledger,
    { redeemVerify } as unknown as LoyaltyKitExtensionPoint,
    fakeSettings([[LoyaltyKitSettings, rates]]),
  );
  const runner = new NativeWorkflowRunnerDriver(
    new MemoryWorkflowJournalDriver(),
    new Locks(new MemoryLockDriver(clock), clock),
    clock,
  );
  const written: RecordedEvent[] = [];
  const outbox = {
    write: async (records: readonly RecordedEvent[]) => void written.push(...records),
  };
  const bound = new Map<AnyClass, object>([
    [RedeemPointsWorkflow, workflow],
    [EventOutbox, outbox],
  ]);
  const resolver: Resolver = {
    has: (token: AnyClass) => bound.has(token),
    get: <T extends object>(token: AnyClass<T>) => bound.get(token) as T,
  };
  runner.connect(resolver);
  return { runner, ledger, clock, written };
}

describe("RedeemPointsWorkflow", () => {
  it("answers with the debit when it parks, and keeps it once the host confirms within the wait", async () => {
    const { runner, ledger, clock, written } = await engineWith();
    const input = RedeemPointsInput.create({ points: 300, reference: "ord_2", totalMinor: 10_000 });

    const output = await runner.start(RedeemPointsWorkflow, input, ORIGIN);

    expect({ ...(output as object) }).toEqual({ points: 300, amountMinor: 300, balance: 700 });
    expect(written.map((record) => record.event)).toEqual([
      PointsRedeemed.create({
        memberId: member,
        points: 300,
        reference: "ord_2",
        balanceAfter: 700,
      }),
    ]);
    expect((await runner.last(RedeemPointsWorkflow))?.status).toBe(WorkflowRunStatus.Waiting);

    const confirmation = { memberId: member, reference: "ord_2" };
    await runner.hold(RedemptionConfirmed, confirmation, confirmation);
    clock.at = plus(1);
    await runner.tick();
    await runner.tick(plus(16)); // past the wait: a confirmed run never compensates

    const run = await runner.last(RedeemPointsWorkflow);
    expect(run?.status).toBe(WorkflowRunStatus.Completed);
    expect(steps(run)).toEqual(["quote:done", "debit:done", "confirm:done"]);
    expect(await ledger.balance(member)).toBe(700);
  });

  it("credits the points back under the revert reference when the host never confirms", async () => {
    const { runner, ledger } = await engineWith();
    const input = RedeemPointsInput.create({ points: 300, reference: "ord_1", totalMinor: 10_000 });

    // the call answers when the run parks, before the wait can time out
    const output = await runner.start(RedeemPointsWorkflow, input, ORIGIN);
    expect({ ...(output as object) }).toMatchObject({ points: 300, balance: 700 });

    await runner.tick(plus(16)); // past the confirm step's 15 minute wait

    const run = await runner.last(RedeemPointsWorkflow);
    expect(run?.status).toBe(WorkflowRunStatus.Compensated);
    expect(run?.error?.code).toBe("workflow_timed_out");
    expect(steps(run)).toEqual(["quote:done", "debit:compensated", "confirm:timed_out"]);
    expect(await ledger.balance(member)).toBe(1_000);
    expect(await ledger.find(member, "revert:ord_1")).toMatchObject({
      kind: EntryKind.Adjust,
      points: 300,
    });
  });

  it("quotes the points a redeemVerify extension lowered, under the caller's reference", async () => {
    const { runner, ledger } = await engineWith(async (input: RedeemPointsInput) => [
      RedeemPointsInput.create({ ...input, points: 100, reference: "ord_other" }),
    ]);
    const input = RedeemPointsInput.create({ points: 300, reference: "ord_3", totalMinor: 10_000 });

    const output = await runner.start(RedeemPointsWorkflow, input, ORIGIN);

    expect({ ...(output as object) }).toEqual({ points: 100, amountMinor: 100, balance: 900 });
    expect(await ledger.find(member, "ord_3")).toMatchObject({
      kind: EntryKind.Redeem,
      points: -100,
    });
  });

  it("quotes at the scope's point value and redemption cap", async () => {
    const { runner } = await engineWith(passThrough, { pointValueMinor: 2, maxRedeemPercent: 1 });
    const input = RedeemPointsInput.create({ points: 300, reference: "ord_4", totalMinor: 10_000 });

    // 1 % of 10 000 is 100 minor units, which at 2 a point is 50 points
    const output = await runner.start(RedeemPointsWorkflow, input, ORIGIN);

    expect({ ...(output as object) }).toEqual({ points: 50, amountMinor: 100, balance: 950 });
  });
});
