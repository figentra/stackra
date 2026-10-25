/**
 * Stackra file contract:
 * Purpose: unit and type tests of `WebhookDelivery`: a model with the `whd` public id and the timestamps, no `@Index`,
 *          and an attempt's endpoint, event and answer typed as the log stores them.
 * Boundary: test only; no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0224 (decision 3); ADR 0135.
 */
import type { PublicId } from "@stackra/contracts";
import { Index, Model, traitsOf } from "@stackra/model";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { WebhookDelivery } from "#node/models/webhook-delivery.model";

describe("WebhookDelivery", () => {
  it("is a model with the whd public id and the timestamps", () => {
    expect(new WebhookDelivery()).toBeInstanceOf(Model);
    expect(traitsOf(WebhookDelivery).map((trait) => trait.name)).toEqual([
      "has_public_id",
      "timestamps",
    ]);
    expect(traitsOf(WebhookDelivery)[0]?.options).toEqual({ prefix: "whd" });
    expect(new WebhookDelivery().id).toMatch(/^whd_[0-9a-z]{26}$/);
  });

  it("leaves its indexes to the migration and types one attempt", () => {
    expect(Index.on(WebhookDelivery)).toEqual([]);
    expectTypeOf<WebhookDelivery["endpointId"]>().toEqualTypeOf<PublicId<"whe">>();
    expectTypeOf<WebhookDelivery["responseStatus"]>().toEqualTypeOf<number | null>();
    expectTypeOf<WebhookDelivery["isDelivered"]>().toEqualTypeOf<boolean>();
  });
});
