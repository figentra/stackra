/**
 * Stackra file contract:
 * Purpose: unit tests of `approverRefusal`: the seat kind, self-approval through the on-behalf-of chain (the agent and
 *          the human it acts for), the step-up, and a grant that meets the rule.
 * Boundary: test only; pure values.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); R3-SO-02; J2-6.
 */
import { type Actor, ActorKind, Realm } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { ApproverRefusal } from "#contracts/enums/approver-refusal.enum";
import type { ApproverRule } from "#contracts/types/approver-rule.type";
import { approverRefusal } from "#core/functions/approver-refusal.function";

const lawyer: Actor = { kind: ActorKind.User, id: "usr_lawyer", realm: Realm.Customer };
const clerk: Actor = { kind: ActorKind.User, id: "usr_clerk", realm: Realm.Customer };
const agentForClerk: Actor = { kind: ActorKind.Agent, id: "agt_1", onBehalfOf: clerk };
const rule: ApproverRule = { seatKind: "lawyer", notRequester: true, stepUp: true };

describe("approverRefusal", () => {
  it("needs the rule's seat kind", () => {
    expect(
      approverRefusal(
        rule,
        { actor: clerk, seatKind: "paralegal", steppedUp: true },
        agentForClerk,
      ),
    ).toBe(ApproverRefusal.SeatKind);
  });

  it("blocks self-approval, including the human an agent acts for", () => {
    expect(
      approverRefusal(rule, { actor: clerk, seatKind: "lawyer", steppedUp: true }, agentForClerk),
    ).toBe(ApproverRefusal.SelfApproval);
    expect(
      approverRefusal(
        { notRequester: true, stepUp: false },
        { actor: agentForClerk, steppedUp: false },
        clerk,
      ),
    ).toBe(ApproverRefusal.SelfApproval);
  });

  it("requires step-up, then lets a qualifying approver grant", () => {
    expect(
      approverRefusal(rule, { actor: lawyer, seatKind: "lawyer", steppedUp: false }, agentForClerk),
    ).toBe(ApproverRefusal.StepUpRequired);
    expect(
      approverRefusal(rule, { actor: lawyer, seatKind: "lawyer", steppedUp: true }, agentForClerk),
    ).toBeUndefined();
    expect(
      approverRefusal(
        { notRequester: false, stepUp: false },
        { actor: clerk, steppedUp: false },
        clerk,
      ),
    ).toBeUndefined();
  });
});
