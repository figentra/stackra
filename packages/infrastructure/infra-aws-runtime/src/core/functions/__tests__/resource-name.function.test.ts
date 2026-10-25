/**
 * Stackra file contract:
 * Purpose: unit tests of `resourceName`: parts are lower-cased, snake_case and dotted keys become single hyphens, and a
 *          name over its limit is cut to exactly the limit with a stable hash that keeps two long names apart.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0231 (names).
 */
import { describe, expect, it } from "@stackra/testing";

import { resourceName } from "#core/functions/resource-name.function";

describe("resourceName", () => {
  it("joins the parts with single hyphens in lower case", () => {
    expect(resourceName(["acme-platform", "staging", "loyalty_kit", "product_images"], 63)).toBe(
      "acme-platform-staging-loyalty-kit-product-images",
    );
    expect(resourceName(["Acme", "staging", "notifications.delivery", "__dlq__"], 80)).toBe(
      "acme-staging-notifications-delivery-dlq",
    );
  });

  it("cuts a long name to the limit with a stable hash", () => {
    const parts = ["acme-platform", "production", "notifications", "cache"];
    const name = resourceName(parts, 40);

    expect(name).toHaveLength(40);
    expect(name).toMatch(/^acme-platform-production-notific-[0-9a-z]{7}$/);
    expect(resourceName(parts, 40)).toBe(name);
    expect(resourceName(["acme-platform", "production", "notifications", "queue"], 40)).not.toBe(
      name,
    );
  });

  it("never ends the cut part on a hyphen", () => {
    // The cut falls right after the first part's hyphen, which is dropped before the hash.
    const name = resourceName(["abcdefghijklmnopqrstuvwxyz", "ab", "cdefghij"], 35);

    expect(name).toMatch(/^abcdefghijklmnopqrstuvwxyz-[0-9a-z]{7}$/);
    expect(name).toHaveLength(34);
  });
});
