/**
 * Stackra file contract:
 * Purpose: unit tests of `resolveApproval`: the fixed order (IAM, entitlement, environment, floor, policy, user, level),
 *          one test per floor item of ADR 0360 decision 8 as the floor data states it, named approvers at L3 and L4
 *          that no mode relaxes, escalation, the organisation tightening before any relaxing, and bypass only where the
 *          organisation allows it.
 * Boundary: test only; the floor here is test data shaped like the platform-floor settings, not a shipped default.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0360 (decisions 5 to 10, enforcement: a test per floor item).
 */
import { describe, expect, it } from "@stackra/testing";

import { resolveApproval } from "#core/functions/resolve-approval.function";
import type { ApprovalRequest } from "#core/types/approval-request.type";
import type { ApprovalRules } from "#core/types/approval-rules.type";

const KEY = "orders.order.cancel@1";

/** A permitted, entitled L2 call with no tags, changed by `over`. */
const request = (over: Partial<ApprovalRequest> = {}): ApprovalRequest => ({
  action: KEY,
  risk: "L2",
  tags: [],
  permitted: true,
  entitled: true,
  ...over,
});

/** Floor test data: the shape of the platform-floor settings. */
const rules = (over: Partial<ApprovalRules> = {}): ApprovalRules => ({
  floor: {
    tags: ["financial", "irreversible", "security", "live-configuration", "deploy", "webhook"],
    tagSets: [["external-communication", "bulk"]],
    recipientLimit: 100,
    deletes: true,
  },
  policy: { allowByDefault: [], ask: [], escalate: [], bypass: false },
  preferences: { alwaysAllow: [], bypass: false },
  ...over,
});

/** Every relaxing layer switched on for `KEY`. */
const relaxed = rules({
  policy: { allowByDefault: [KEY], ask: [], escalate: [], bypass: true },
  preferences: { alwaysAllow: [KEY], bypass: true },
});

describe("resolveApproval", () => {
  it("refuses at IAM, then entitlement, then a live configuration change, in that order", () => {
    expect(resolveApproval(request({ permitted: false, entitled: false }), rules())).toEqual({
      outcome: "refused",
      step: "iam",
    });
    expect(resolveApproval(request({ entitled: false }), rules())).toEqual({
      outcome: "refused",
      step: "entitlement",
    });
    expect(resolveApproval(request({ liveConfiguration: true }), relaxed)).toEqual({
      outcome: "refused",
      step: "environment",
    });
  });

  it.each([
    ["money movement", { tags: ["financial"] }],
    ["bulk customer messages", { tags: ["external-communication", "bulk"] }],
    ["a send over the recipient limit", { tags: ["external-communication"], recipients: 101 }],
    ["an agent delete, soft included", { deletes: true }],
    ["an irreversible action", { tags: ["irreversible"] }],
    ["security and access", { tags: ["security"] }],
    ["code deploys", { tags: ["deploy"] }],
  ] as const)("never passes the floor for %s", (_name, over) => {
    expect(resolveApproval(request({ risk: "L1", ...over }), relaxed)).toEqual({
      outcome: "named_approver",
      step: "floor",
    });
  });

  it("lets a send at the recipient limit through to the lower layers", () => {
    const decision = resolveApproval(
      request({ tags: ["external-communication"], recipients: 100 }),
      relaxed,
    );
    expect(decision.outcome).toBe("run");
  });

  it("needs a named approver at L3 and L4 whatever the modes", () => {
    for (const risk of ["L3", "L4"])
      expect(resolveApproval(request({ risk }), relaxed)).toEqual({
        outcome: "named_approver",
        step: "level",
      });
  });

  it("escalates a floor or named-approver call the organisation escalates", () => {
    const escalating = rules({
      policy: { allowByDefault: [], ask: [], escalate: [KEY], bypass: true },
    });
    expect(resolveApproval(request({ tags: ["financial"] }), escalating)).toEqual({
      outcome: "escalate",
      step: "floor",
      mode: "escalate",
    });
    expect(resolveApproval(request({ risk: "L4" }), escalating).step).toBe("level");
    expect(resolveApproval(request(), escalating)).toEqual({
      outcome: "escalate",
      step: "policy",
      mode: "escalate",
    });
  });

  it("lets the organisation's ask win over every relaxing layer", () => {
    const asking = rules({
      policy: { allowByDefault: [KEY], ask: [KEY], escalate: [], bypass: true },
      preferences: { alwaysAllow: [KEY], bypass: true },
    });
    expect(resolveApproval(request(), asking)).toEqual({
      outcome: "confirm",
      step: "policy",
      mode: "ask",
    });
  });

  it("runs L0 and L1 at once", () => {
    for (const risk of ["L0", "L1"])
      expect(resolveApproval(request({ risk }), rules())).toEqual({
        outcome: "run",
        step: "level",
      });
  });

  it("relaxes an L2 call by allow by default, then always allow, then an allowed bypass", () => {
    expect(
      resolveApproval(
        request(),
        rules({ policy: { allowByDefault: [KEY], ask: [], escalate: [], bypass: false } }),
      ),
    ).toEqual({ outcome: "run", step: "policy", mode: "allow_by_default" });
    expect(
      resolveApproval(request(), rules({ preferences: { alwaysAllow: [KEY], bypass: false } })),
    ).toEqual({ outcome: "run", step: "user", mode: "always_allow" });
    expect(
      resolveApproval(
        request(),
        rules({
          policy: { allowByDefault: [], ask: [], escalate: [], bypass: true },
          preferences: { alwaysAllow: [], bypass: true },
        }),
      ),
    ).toEqual({ outcome: "run", step: "user", mode: "bypass" });
  });

  it("ignores a bypass session the organisation does not allow", () => {
    expect(
      resolveApproval(request(), rules({ preferences: { alwaysAllow: [], bypass: true } })),
    ).toEqual({ outcome: "confirm", step: "level", mode: "ask" });
  });

  it("refuses a risk outside L0 to L4", () => {
    expect(() => resolveApproval(request({ risk: "L5" }), rules())).toThrow(RangeError);
  });
});
