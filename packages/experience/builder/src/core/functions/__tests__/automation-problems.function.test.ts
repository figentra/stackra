/**
 * Stackra file contract:
 * Purpose: unit tests of `automationProblems`: nothing for a document `checkAutomation` accepts, and the same field
 *          errors it raises for one it refuses, without throwing.
 * Boundary: test only; registers one trigger and one action block in @stackra/workflow's registry.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0426 (decision 3); ADR 0122 (decision 3).
 */
import { Action } from "@stackra/actions";
import { ActorKind } from "@stackra/contracts";
import { DomainEvent } from "@stackra/events";
import { describe, expect, it } from "@stackra/testing";
import { BlockKind, registerBlocks } from "@stackra/workflow";

import { automationProblems } from "#core/functions/automation-problems.function";

class LeadCaptured extends DomainEvent {}

class SendWelcomeAction extends Action({ key: "welcome.send", actors: [ActorKind.System] }) {
  async handle(): Promise<void> {}
}

registerBlocks([
  {
    key: "crm.lead_captured",
    kind: BlockKind.Trigger,
    type: LeadCaptured,
    label: "crm::blocks.lead",
  },
  {
    key: "welcome.send",
    kind: BlockKind.Action,
    type: SendWelcomeAction,
    label: "crm::blocks.welcome",
  },
]);

const DOCUMENT = {
  key: "crm.welcome",
  trigger: { block: "crm.lead_captured" },
  steps: [{ name: "welcome", block: "welcome.send" }],
};

describe(automationProblems, () => {
  it("finds nothing in a document the workflow package accepts", () => {
    expect(automationProblems(DOCUMENT)).toEqual({});
  });

  it("returns the refusal's field errors instead of throwing", () => {
    const problems = automationProblems({
      ...DOCUMENT,
      steps: [{ name: "welcome", block: "nobody.has_this" }],
    });
    expect(Object.keys(problems)).toContain("steps.0.block");
  });
});
