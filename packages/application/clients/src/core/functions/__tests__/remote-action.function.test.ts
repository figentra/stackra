/**
 * Stackra file contract:
 * Purpose: unit and type tests of `remoteAction`: a service's action descriptor is an action ref whose `endpoint` is the
 *          route, with or without one.
 * Boundary: test only; the descriptors restate the template's generated `services/commerce` payments client.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0260 (decisions 3 and 6).
 */
import { HttpMethod } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { z } from "zod";

import { remoteAction } from "#core/functions/remote-action.function";
import type { ActionInput } from "#core/types/action-input.type";

const VoidPaymentInput$ = z.object({ paymentId: z.string() });

const VoidPaymentAction = remoteAction("payments.payment.void@1", {
  input: VoidPaymentInput$,
  output: VoidPaymentInput$,
  endpoint: { method: HttpMethod.Put, path: "/payments/:paymentId/void" },
});

const RecordVisitAction = remoteAction("analytics.visit.record@1", {
  input: z.object({ path: z.string() }),
  output: z.object({}),
});

describe("remoteAction", () => {
  it("is an action ref whose route is the endpoint", () => {
    expect(VoidPaymentAction.kind).toBe("action");
    expect(VoidPaymentAction.key).toBe("payments.payment.void@1");
    expect(VoidPaymentAction.endpoint).toEqual({
      method: "PUT",
      path: "/payments/:paymentId/void",
    });
    expect(VoidPaymentAction.input).toBe(VoidPaymentInput$);
  });

  it("has no route when none is given", () => {
    expect("endpoint" in RecordVisitAction).toBe(false);
  });

  it("types its input", () => {
    expectTypeOf<ActionInput<typeof VoidPaymentAction>>().toEqualTypeOf<{ paymentId: string }>();
  });
});
