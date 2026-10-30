/**
 * Stackra file contract:
 * Purpose: unit tests of `ClientResultInput`, its shipped schema and the `CLIENT_RESULT_ACTION` contract: a result or
 *          a refusal parses, both or neither fails, and the action is `PUT /runs/:runId/client-result`.
 * Boundary: test only; validates through @stackra/validation.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0490 (decision 4); STA-1631.
 */
import { describe, expect, it } from "@stackra/testing";
import { schemaOf, validate } from "@stackra/validation";

import { CLIENT_RESULT_ACTION } from "#core/constants/client-result-action.constant";
import { CLIENT_RESULT_INPUT_SCHEMA } from "#core/constants/client-result-input-schema.constant";
import { ClientResultInput } from "#core/schemas/client-result-input.schema";

const RUN = "airun_01h2j3k4l5m6n7p8q9r0s1t2v3";

describe("ClientResultInput", () => {
  it("registers the shipped schema and takes a result or a refusal", () => {
    expect(schemaOf(ClientResultInput)).toBe(CLIENT_RESULT_INPUT_SCHEMA);
    expect(
      validate(ClientResultInput, { runId: RUN, toolCallId: "call_1", result: { done: true } })
        .success,
    ).toBe(true);
    expect(
      validate(ClientResultInput, { runId: RUN, toolCallId: "call_1", refusal: "handler_missing" })
        .success,
    ).toBe(true);
  });

  it("refuses both, neither and a free-text note", () => {
    const base = { runId: RUN, toolCallId: "call_1" };
    expect(
      validate(ClientResultInput, { ...base, result: { done: true }, refusal: "x_y" }).success,
    ).toBe(false);
    expect(validate(ClientResultInput, base).success).toBe(false);
    expect(
      validate(ClientResultInput, { ...base, result: { done: true, note: "Order 12 is late" } })
        .success,
    ).toBe(false);
  });

  it("names the action contract", () => {
    expect(CLIENT_RESULT_ACTION).toEqual({
      key: "ai.run.client_result",
      method: "PUT",
      path: "/runs/:runId/client-result",
    });
  });
});
