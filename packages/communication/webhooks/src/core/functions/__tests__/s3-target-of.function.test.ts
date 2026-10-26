/**
 * Stackra file contract:
 * Purpose: unit tests of `s3TargetOf` and `webhookObjectKey`: an s3 URL gives its bucket, prefix and region; an https
 *          URL is not a target; a bad bucket, prefix or query is refused; the key is the prefix, the type, the UTC day
 *          and the event id.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0422 (decision 4).
 */
import { describe, expect, it } from "@stackra/testing";

import { s3TargetOf } from "#core/functions/s3-target-of.function";
import { webhookObjectKey } from "#core/functions/webhook-object-key.function";

describe(s3TargetOf, () => {
  it("takes an s3 URL apart", () => {
    expect(s3TargetOf("s3://acme-siem/stackra/audit/?region=me-central-1")).toEqual({
      bucket: "acme-siem",
      prefix: "stackra/audit",
      region: "me-central-1",
    });
    expect(s3TargetOf("s3://acme-siem")).toEqual({ bucket: "acme-siem", prefix: "" });
  });

  it("answers undefined for an https URL", () => {
    expect(s3TargetOf("https://hooks.acme.example/in")).toBeUndefined();
  });

  it("refuses a bad bucket, prefix or query", () => {
    for (const url of [
      "s3://Acme/x",
      "s3://ab/x",
      "s3://acme-siem/../x",
      "s3://acme-siem/x?acl=public-read",
      "s3://acme-siem/x?region=moon",
    ])
      expect(() => s3TargetOf(url)).toThrow(TypeError);
  });
});

describe(webhookObjectKey, () => {
  const at = new Date("2026-10-26T23:59:59Z");

  it("keys a delivery by prefix, type, UTC day and event id", () => {
    expect(
      webhookObjectKey({ bucket: "b", prefix: "siem" }, "orders.order.paid.v1", "evt_1", at),
    ).toBe("siem/orders.order.paid.v1/2026/10/26/evt_1.json");
    expect(webhookObjectKey({ bucket: "b", prefix: "" }, "t.v1", "evt_2", at)).toBe(
      "t.v1/2026/10/26/evt_2.json",
    );
  });
});
