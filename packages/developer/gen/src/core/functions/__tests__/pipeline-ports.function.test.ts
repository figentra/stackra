/**
 * Stackra file contract:
 * Purpose: unit tests of `pipelinePorts`: a service with an integration event (own or hosted) or a metered action
 *          reaches `EventOutbox`; an action that is not `Idempotency.Never` reaches `IdempotencyStore`; `offline`,
 *          `offline.cap`, `accepts` and `stepUp` reach their stores; a declared workflow reaches `WorkflowRunner`; a
 *          package reaches none.
 * Boundary: test only; runs on the commerce IR fixture.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0263; STA-2573.
 */
import { describe, expect, it } from "@stackra/testing";

import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";
import { pipelinePorts } from "#core/functions/pipeline-ports.function";
import type { DeclaredClass } from "#core/types/declared-class.type";
import type { MemberIR } from "#core/types/member-ir.type";

/** The fixture's classes without its events, each action's options replaced by `options`. */
function withActions(
  options: Readonly<Record<string, unknown>>,
  ir: MemberIR = COMMERCE_IR,
): MemberIR {
  return {
    ...ir,
    classes: ir.classes
      .filter((declared) => declared.kind !== "integration_event")
      .map((declared): DeclaredClass =>
        declared.kind === "action"
          ? { ...declared, options: { key: "x.y", ...options } }
          : declared,
      ),
  };
}

const names = (ir: MemberIR): string[] => pipelinePorts(ir).map((port) => port.class.name);

describe("pipelinePorts", () => {
  it("reaches the outbox and the idempotency store for the fixture's event and action", () => {
    expect(names(COMMERCE_IR)).toEqual(["EventOutbox", "IdempotencyStore"]);
  });

  it("reaches nothing for a never-idempotent action and no event", () => {
    expect(names(withActions({ idempotency: "never" }))).toEqual([]);
  });

  it("reaches the outbox for a hosted integration event, a meter or analytics", () => {
    const hosted: MemberIR = {
      ...withActions({ idempotency: "never" }),
      dependencies: [
        {
          package: "@stackra/workflow",
          manifest: {
            member: "workflow",
            package: "@stackra/workflow",
            version: "0.20.0",
            events: [{ name: "workflow.service.acked.v1", kind: "integration" }],
          } as unknown as MemberIR["dependencies"][number]["manifest"],
        },
      ],
    };
    expect(names(hosted)).toEqual(["EventOutbox"]);
    expect(names(withActions({ idempotency: "never", meter: { name: "m" } }))).toEqual([
      "EventOutbox",
    ]);
    expect(names(withActions({ idempotency: "never", analytics: {} }))).toEqual(["EventOutbox"]);
  });

  it("reaches the offline, review and step-up stores for what an action declares", () => {
    expect(
      names(
        withActions({
          idempotency: "never",
          offline: { cap: { count: 3 } },
          accepts: {},
          stepUp: "aal2",
        }),
      ),
    ).toEqual(["DeviceSequenceStore", "OfflineCapStore", "ReviewItemSink", "StepUpCheck"]);
    expect(names(withActions({ idempotency: "never", offline: {} }))).toEqual([
      "DeviceSequenceStore",
    ]);
  });

  it("reaches the workflow runner for a declared workflow", () => {
    const ir = withActions({ idempotency: "never" });
    const action = ir.classes.find((declared) => declared.kind === "action");
    if (action === undefined) throw new Error("the fixture declares an action");
    const workflow: DeclaredClass = {
      ...action,
      name: "RestockWorkflow",
      kind: "workflow",
      options: {},
    };
    expect(names(ir)).toEqual([]);
    expect(names({ ...ir, classes: [...ir.classes, workflow] })).toEqual(["WorkflowRunner"]);
  });

  it("reaches nothing in a package", () => {
    expect(pipelinePorts({ ...COMMERCE_IR, layout: "package" })).toEqual([]);
  });
});
