/**
 * Stackra file contract:
 * Purpose: unit tests of `DeliverWebhookInput` and its shipped schema: a schema class registered with
 *          `DELIVER_WEBHOOK_INPUT_SCHEMA`, built with `create`, taking any store's receiver id and refusing an empty one,
 *          an empty event id or type and an empty body.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 26); ADR 0305 (Input in its own file).
 */
import { describe, expect, it } from "@stackra/testing";
import { Schema, schemaOf } from "@stackra/validation";

import { DELIVER_WEBHOOK_INPUT_SCHEMA } from "#node/constants/deliver-webhook-input-schema.constant";
import { DeliverWebhookInput } from "#node/schemas/deliver-webhook-input.schema";

const VALID = {
  endpointId: "whe_01j9z3k4m5n6p7q8r9s0t1v2w1",
  eventId: "evt_1",
  type: "orders.order.paid.v1",
  body: '{"type":"orders.order.paid.v1"}',
} as const;

describe("DeliverWebhookInput", () => {
  it("is a schema class registered with its shipped schema", () => {
    expect(DeliverWebhookInput.prototype).toBeInstanceOf(Schema);
    expect(schemaOf(DeliverWebhookInput)).toBe(DELIVER_WEBHOOK_INPUT_SCHEMA);
    expect(DeliverWebhookInput.create(VALID)).toMatchObject(VALID);
  });

  it("takes a host store's id, and refuses an empty receiver, event or body", () => {
    expect(DELIVER_WEBHOOK_INPUT_SCHEMA.safeParse({ ...VALID, endpointId: "ple_1" }).success).toBe(
      true,
    );
    expect(DELIVER_WEBHOOK_INPUT_SCHEMA.safeParse({ ...VALID, endpointId: "" }).success).toBe(
      false,
    );
    expect(DELIVER_WEBHOOK_INPUT_SCHEMA.safeParse({ ...VALID, eventId: "" }).success).toBe(false);
    expect(DELIVER_WEBHOOK_INPUT_SCHEMA.safeParse({ ...VALID, type: "" }).success).toBe(false);
    expect(DELIVER_WEBHOOK_INPUT_SCHEMA.safeParse({ ...VALID, body: "" }).success).toBe(false);
  });
});
