/**
 * Stackra file contract:
 * Purpose: unit tests of `costControls` under Pulumi's mocks: the budget with one notification per threshold on a
 *          topic only AWS Budgets of this account may publish to; and, when a stop percentage is set and there are
 *          roles to stop, the deny policy, the budget action's role and the automatic action that attaches the policy.
 * Boundary: test only; no engine and no cloud call.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0172 (cost controls: the budget stops non-production spend).
 */
import * as pulumi from "@pulumi/pulumi";
import { describe, expect, it } from "@stackra/testing";

import { costControls } from "#node/functions/cost-controls.function";
import { mockPulumi } from "#testing/functions/mock-pulumi.function";

/** The arguments with the given stop percentage and stoppable roles. */
function argsWith(stopAt: number | null, stoppable: readonly string[]) {
  return {
    account: "111111111111",
    budgets: { monthlyUsd: "500", thresholds: [50, 80, 100], stopAt },
    stoppable: stoppable.map((role) => pulumi.output(role)),
    actionRoleName: "acme-staging-budget-action",
  };
}

describe("costControls", () => {
  it("alerts at each threshold through a topic only this account's Budgets can publish to", async () => {
    const engine = await mockPulumi();
    costControls("acme", argsWith(null, []), {});

    const budget = await engine.find("Budget", "acme");
    expect(budget.inputs).toMatchObject({
      budgetType: "COST",
      limitAmount: "500",
      limitUnit: "USD",
      timeUnit: "MONTHLY",
    });
    expect(
      (budget.inputs["notifications"] as { threshold: number }[]).map((entry) => entry.threshold),
    ).toEqual([50, 80, 100]);
    const policy = JSON.parse(
      (await engine.find("TopicPolicy", "acme-budgets")).inputs["policy"] as string,
    ) as { Statement: Record<string, unknown>[] };
    expect(policy.Statement[0]).toMatchObject({
      Principal: { Service: "budgets.amazonaws.com" },
      Action: "SNS:Publish",
      Condition: {
        StringEquals: { "aws:SourceAccount": "111111111111" },
        ArnLike: { "aws:SourceArn": "arn:aws:budgets::111111111111:*" },
      },
    });
  });

  it("stops nothing without a stop percentage or without roles to stop", async () => {
    for (const args of [argsWith(null, ["role"]), argsWith(100, [])]) {
      const engine = await mockPulumi();
      costControls("acme", args, {});
      const types = (await engine.settled()).map((resource) => resource.type.split(":").at(-1));

      expect(types).not.toContain("BudgetAction");
      expect(types).not.toContain("Policy");
    }
  });

  it("attaches a deny policy to the stoppable roles automatically at the stop percentage", async () => {
    const engine = await mockPulumi();
    costControls("acme", argsWith(100, ["acme-staging-infra", "acme-staging-encore"]), {});

    const stop = JSON.parse(
      (await engine.find("Policy", "acme-stop-spend")).inputs["policy"] as string,
    ) as { Statement: Record<string, unknown>[] };
    expect(stop.Statement[0]).toMatchObject({ Effect: "Deny", Resource: "*" });
    expect(stop.Statement[0]?.["Action"]).toContain("rds:CreateDBInstance");
    expect((await engine.find("Role", "acme-budget-action")).inputs["name"]).toBe(
      "acme-staging-budget-action",
    );
    expect((await engine.find("RolePolicyAttachment", "acme-budget-action")).inputs).toMatchObject({
      policyArn: "arn:aws:iam::aws:policy/AWSBudgetsActionsWithAWSResourceControlAccess",
    });
    expect((await engine.find("BudgetAction", "acme")).inputs).toMatchObject({
      actionType: "APPLY_IAM_POLICY",
      approvalModel: "AUTOMATIC",
      actionThreshold: { actionThresholdType: "PERCENTAGE", actionThresholdValue: 100 },
      definition: {
        iamActionDefinition: { roles: ["acme-staging-infra", "acme-staging-encore"] },
      },
    });
  });
});
