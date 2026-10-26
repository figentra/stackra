/**
 * Stackra file contract:
 * Purpose: unit tests of `PlanCatalogueService`: seed records become approved version 1 once; a plain change is in
 *          force from its date at the next term start; a discount waits for a second approver and its proposer cannot
 *          approve it; rejected and pending versions are never in force; backdated changes are refused.
 * Boundary: test only; the memory versions driver, real `Locks` over `MemoryLockDriver`, a fixed clock. The rows are
 *           test data standing in for seed-pack rows.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0391 (decisions 2 to 5); owner OS-82, OS-381.
 */
import { Driver } from "@stackra/container";
import { Clock } from "@stackra/contracts";
import { Locks, MemoryLockDriver } from "@stackra/locking";
import { beforeEach, describe, expect, it } from "@stackra/testing";

import { CatalogueVersionState } from "#contracts/enums/catalogue-version-state.enum";
import { MemoryCatalogueVersionsDriver } from "#core/drivers/memory-catalogue-versions.driver";
import { CatalogueChangeBackdatedError } from "#core/errors/catalogue-change-backdated.error";
import { CatalogueVersionNotPendingError } from "#core/errors/catalogue-version-not-pending.error";
import { SecondApproverRequiredError } from "#core/errors/second-approver-required.error";
import { PlanCatalogueService } from "#core/services/plan-catalogue.service";

/** Always 2026-10-26 09:00 UTC. */
class FixedClockDriver extends Driver(Clock) {
  now(): Date {
    return new Date("2026-10-26T09:00:00Z");
  }
}

const LAUNCH = new Date("2026-10-01T00:00:00Z");
const RENEWAL = new Date("2026-12-01T00:00:00Z");
const TERM_STARTED = new Date("2026-11-01T00:00:00Z");
const ROWS = [{ id: "pro-month", answer: "test", tier: "pro", amount: "99.00" }];
const CHEAPER = [{ id: "pro-month", answer: "test", tier: "pro", amount: "79.00" }];

describe("PlanCatalogueService", () => {
  let catalogue: PlanCatalogueService;

  beforeEach(() => {
    const clock = new FixedClockDriver();
    catalogue = new PlanCatalogueService(
      new MemoryCatalogueVersionsDriver(),
      new Locks(new MemoryLockDriver(clock), clock),
      clock,
    );
  });

  it("seeds each record once as approved version 1", async () => {
    const records = [{ kind: "price-list", key: "price-list:commerce", rows: ROWS }];
    expect(await catalogue.seed(records, "seed-pack:commerce", LAUNCH)).toEqual([
      "price-list:commerce",
    ]);
    expect(await catalogue.seed(records, "seed-pack:commerce", LAUNCH)).toEqual([]);
    const [seeded] = await catalogue.history("price-list:commerce");
    expect(seeded).toMatchObject({
      version: 1,
      state: CatalogueVersionState.Approved,
      proposedBy: "seed-pack:commerce",
    });
  });

  it("applies a change from its date, so a running term picks it up at renewal", async () => {
    await catalogue.seed(
      [{ kind: "price-list", key: "price-list:commerce", rows: ROWS }],
      "seed-pack:commerce",
      LAUNCH,
    );
    const change = await catalogue.propose(
      {
        key: "price-list:commerce",
        kind: "price-list",
        rows: CHEAPER,
        effectiveFrom: TERM_STARTED,
        discount: false,
      },
      "usr_rana",
    );
    expect(change).toMatchObject({
      version: 2,
      state: CatalogueVersionState.Approved,
      decidedBy: "usr_rana",
    });
    expect((await catalogue.inForce("price-list:commerce", LAUNCH))?.version).toBe(1);
    expect((await catalogue.inForce("price-list:commerce", RENEWAL))?.version).toBe(2);
  });

  it("holds a discount until someone else approves it", async () => {
    const draft = await catalogue.propose(
      {
        key: "offer:founding",
        kind: "offer",
        rows: ROWS,
        effectiveFrom: TERM_STARTED,
        discount: true,
      },
      "usr_rana",
    );
    expect(draft.state).toBe(CatalogueVersionState.Pending);
    expect(await catalogue.inForce("offer:founding", RENEWAL)).toBeUndefined();
    await expect(catalogue.approve("offer:founding", 1, "usr_rana")).rejects.toBeInstanceOf(
      SecondApproverRequiredError,
    );
    const approved = await catalogue.approve("offer:founding", 1, "usr_omar");
    expect(approved).toMatchObject({
      state: CatalogueVersionState.Approved,
      decidedBy: "usr_omar",
    });
    expect((await catalogue.inForce("offer:founding", RENEWAL))?.version).toBe(1);
    await expect(catalogue.approve("offer:founding", 1, "usr_lina")).rejects.toBeInstanceOf(
      CatalogueVersionNotPendingError,
    );
  });

  it("never applies a rejected discount", async () => {
    await catalogue.propose(
      {
        key: "offer:founding",
        kind: "offer",
        rows: ROWS,
        effectiveFrom: TERM_STARTED,
        discount: true,
      },
      "usr_rana",
    );
    expect((await catalogue.reject("offer:founding", 1, "usr_rana")).state).toBe(
      CatalogueVersionState.Rejected,
    );
    expect(await catalogue.inForce("offer:founding", RENEWAL)).toBeUndefined();
    await expect(catalogue.reject("offer:founding", 9, "usr_rana")).rejects.toBeInstanceOf(
      CatalogueVersionNotPendingError,
    );
  });

  it("refuses a change dated before now", async () => {
    await expect(
      catalogue.propose(
        {
          key: "price-list:commerce",
          kind: "price-list",
          rows: ROWS,
          effectiveFrom: LAUNCH,
          discount: false,
        },
        "usr_rana",
      ),
    ).rejects.toBeInstanceOf(CatalogueChangeBackdatedError);
  });
});
