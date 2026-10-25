/**
 * Stackra file contract:
 * Purpose: unit tests of `costControls` under Pulumi's mocks: a monthly budget on the billing account scoped to one
 *          project, in the runway's currency, with a rule at each threshold, notifying a topic the billing service may
 *          publish to; a fractional amount splits into units and nanos; a malformed amount fails.
 * Boundary: test only; no engine and no cloud call.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0172 (decision 5), ADR 0354.
 */
import { describe, expect, it } from "@stackra/testing";

import { costControls } from "#node/functions/cost-controls.function";
import { mockPulumi } from "#testing/functions/mock-pulumi.function";
import { outputOf } from "#testing/functions/output-of.function";

/** The arguments; `amount` varies. */
function argsWith(amount: string) {
  return {
    project: "acme-stg",
    projectNumber: "42",
    billingAccount: "012345-6789AB-CDEF01",
    currency: "EUR",
    amount,
    thresholds: [50, 80, 100],
  };
}

describe("costControls", () => {
  it("budgets one project monthly and notifies the topic", async () => {
    const engine = await mockPulumi();
    const topic = costControls("acme-staging", argsWith("2000"), {});

    expect((await engine.find("Budget", "acme-staging")).inputs).toEqual({
      billingAccount: "012345-6789AB-CDEF01",
      displayName: "acme-staging",
      budgetFilter: { projects: ["projects/42"], calendarPeriod: "MONTH" },
      amount: { specifiedAmount: { currencyCode: "EUR", units: "2000", nanos: 0 } },
      thresholdRules: [
        { thresholdPercent: 0.5 },
        { thresholdPercent: 0.8 },
        { thresholdPercent: 1 },
      ],
      allUpdatesRule: { pubsubTopic: "acme-staging-budgets-id", schemaVersion: "1.0" },
    });
    expect((await engine.find("TopicIAMMember", "acme-staging-budgets")).inputs).toEqual({
      project: "acme-stg",
      topic: "acme-staging-budgets",
      role: "roles/pubsub.publisher",
      member: "serviceAccount:billing-budget-alert@system.gserviceaccount.com",
    });
    expect(await outputOf(topic.id)).toBe("acme-staging-budgets-id");
  });

  it("splits a fractional amount into units and nanos", async () => {
    const engine = await mockPulumi();
    costControls("acme-staging", argsWith("1500.5"), {});

    expect((await engine.find("Budget", "acme-staging")).inputs["amount"]).toEqual({
      specifiedAmount: { currencyCode: "EUR", units: "1500", nanos: 500000000 },
    });
  });

  it("refuses an amount that is not a decimal number", async () => {
    await mockPulumi();

    expect(() => costControls("acme-staging", argsWith("lots"), {})).toThrow(
      /not a decimal amount/,
    );
  });
});
