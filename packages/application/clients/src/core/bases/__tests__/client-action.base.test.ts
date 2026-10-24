/**
 * Stackra file contract:
 * Purpose: unit and type tests of `ClientAction`: the key inside the options gives the same action ref as `actionRef`.
 * Boundary: test only; the action restates the template's generated `apps/web` marketing client.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0260 (decision 3).
 */
import { HttpMethod } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { z } from "zod";

import { ClientAction } from "#core/bases/client-action.base";
import type { ActionInput } from "#core/types/action-input.type";

class CreateLeadAction extends ClientAction({
  key: "leads.lead.create",
  input: z.object({ name: z.string(), consent: z.literal(true) }),
  output: z.object({ leadId: z.string() }),
  http: { method: HttpMethod.Post, path: "/public/leads" },
  risk: "l0",
}) {}

describe("ClientAction", () => {
  it("is an action ref keyed by its option", () => {
    expect(CreateLeadAction.kind).toBe("action");
    expect(CreateLeadAction.key).toBe("leads.lead.create");
    expect(CreateLeadAction.permission).toBe("leads.lead.create");
    expect(CreateLeadAction.endpoint).toEqual({ method: "POST", path: "/public/leads" });
    expect("key" in CreateLeadAction.texts).toBe(false);
  });

  it("types its input", () => {
    expectTypeOf<ActionInput<typeof CreateLeadAction>>().toEqualTypeOf<{
      name: string;
      consent: true;
    }>();
  });
});
