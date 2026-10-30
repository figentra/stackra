/**
 * Stackra file contract:
 * Purpose: unit tests of `ClientToolNotPendingError`: a FailedPrecondition refusal with code `client_tool_not_pending`
 *          that names the tool call id.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0140; ADR 0490 (decision 4); STA-1631.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { ClientToolNotPendingError } from "#core/errors/client-tool-not-pending.error";

describe(ClientToolNotPendingError, () => {
  it("is a FailedPrecondition refusal with code client_tool_not_pending naming the tool call", () => {
    const refused = ClientToolNotPendingError.create({ toolCallId: "call_1" });
    expect(isRefusal(refused, ClientToolNotPendingError)).toBe(true);
    expect(refused.code).toBe("client_tool_not_pending");
    expect(refused.kind).toBe(ErrorKind.FailedPrecondition);
    expect(refused.retryable).toBe(false);
    expect(refused).toMatchObject({ toolCallId: "call_1" });
  });
});
