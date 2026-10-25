/**
 * Stackra file contract:
 * Purpose: unit tests of `WebhookDeliveryFailedError`: a retryable `unavailable` refusal (HTTP 503) whose only detail
 *          is the endpoint's status, `null` when it did not answer.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0224 (decision 3); ADR 0140; ADR 0328.
 */
import { Enum } from "@stackra/contracts";
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { WebhookDeliveryFailedError } from "#core/errors/webhook-delivery-failed.error";

describe("WebhookDeliveryFailedError", () => {
  it("is a retryable unavailable refusal carrying the endpoint's status", () => {
    const error = WebhookDeliveryFailedError.create({ status: 500 });
    expect(isRefusal(error, WebhookDeliveryFailedError)).toBe(true);
    expect(error.retryable).toBe(true);
    expect(Enum.meta(ErrorKind, error.kind).httpStatus).toBe(503);
    expect(error.toEnvelope()).toEqual({
      code: "webhook_delivery_failed",
      category: "unavailable",
      retryable: true,
      details: { status: 500 },
    });
  });

  it("carries a null status when the endpoint did not answer", () => {
    expect(WebhookDeliveryFailedError.create({ status: null }).details).toEqual({ status: null });
  });
});
