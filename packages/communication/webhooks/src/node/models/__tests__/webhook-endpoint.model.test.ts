/**
 * Stackra file contract:
 * Purpose: unit and type tests of `WebhookEndpoint`: a model with the `whe` public id and the timestamps, no `@Index`
 *          (the indexes are the migration's), secret names typed as strings, and the rotation rule: the replaced secret
 *          still signs for 24 hours after a rotation, then only the current one.
 * Boundary: test only; no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0308 (rule 17); ADR 0327 (decisions 3 and 9); ADR 0135.
 */
import type { PublicId } from "@stackra/contracts";
import { Index, Model, traitsOf } from "@stackra/model";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { WebhookEndpoint } from "#node/models/webhook-endpoint.model";

const ROTATED = new Date("2026-10-25T09:00:00Z");

/** An endpoint with `data`. */
const endpointOf = (data: Partial<WebhookEndpoint>): WebhookEndpoint =>
  Object.assign(new WebhookEndpoint(), {
    secretName: "ACME_WEBHOOK_SECRET_2",
    previousSecretName: null,
    rotatedAt: null,
    ...data,
  });

describe("WebhookEndpoint", () => {
  it("is a model with the whe public id and the timestamps", () => {
    expect(new WebhookEndpoint()).toBeInstanceOf(Model);
    expect(traitsOf(WebhookEndpoint).map((trait) => trait.name)).toEqual([
      "has_public_id",
      "timestamps",
    ]);
    expect(traitsOf(WebhookEndpoint)[0]?.options).toEqual({ prefix: "whe" });
    expect(new WebhookEndpoint().id).toMatch(/^whe_[0-9a-z]{26}$/);
  });

  it("leaves its indexes to the migration and types its scope and secret names", () => {
    expect(Index.on(WebhookEndpoint)).toEqual([]);
    expectTypeOf<WebhookEndpoint["scopeId"]>().toEqualTypeOf<PublicId<"scp">>();
    expectTypeOf<WebhookEndpoint["secretName"]>().toEqualTypeOf<string>();
    expectTypeOf<WebhookEndpoint["disabledAt"]>().toEqualTypeOf<Date | null>();
  });

  it("signs with the current secret only before any rotation", () => {
    expect(endpointOf({}).secretNamesAt(ROTATED)).toEqual(["ACME_WEBHOOK_SECRET_2"]);
  });

  it("signs with both secrets for 24 hours after a rotation, then with the current one", () => {
    const endpoint = endpointOf({
      previousSecretName: "ACME_WEBHOOK_SECRET_1",
      rotatedAt: ROTATED,
    });
    const hours = (count: number) => new Date(ROTATED.getTime() + count * 3_600_000);
    expect(endpoint.secretNamesAt(hours(23.9))).toEqual([
      "ACME_WEBHOOK_SECRET_2",
      "ACME_WEBHOOK_SECRET_1",
    ]);
    expect(endpoint.secretNamesAt(hours(24))).toEqual(["ACME_WEBHOOK_SECRET_2"]);
  });
});
