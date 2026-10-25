/**
 * Stackra file contract:
 * Purpose: unit tests of `resolvePlaceholders`: each `{field}` is filled from the lookup, text around it is kept, and a
 *          placeholder without a value throws naming the field, never a value.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0308 (rule 4).
 */
import { describe, expect, it } from "@stackra/testing";

import { resolvePlaceholders } from "#core/functions/resolve-placeholders.function";

const values: Readonly<Record<string, string>> = { apiKey: "re_secret", region: "eu" };
const lookup = (name: string): string | undefined => values[name];

describe("resolvePlaceholders", () => {
  it("fills every placeholder and keeps the text around them", () => {
    expect(resolvePlaceholders("Bearer {apiKey}", lookup)).toBe("Bearer re_secret");
    expect(resolvePlaceholders("https://{region}.api.example/{region}", lookup)).toBe(
      "https://eu.api.example/eu",
    );
    expect(resolvePlaceholders("no placeholder", lookup)).toBe("no placeholder");
  });

  it("names the missing field and no value", () => {
    expect(() => resolvePlaceholders("{apiKey}:{clientSecret}", lookup)).toThrow(
      "{clientSecret} has no value on the connection or the integration",
    );
    try {
      resolvePlaceholders("{apiKey}:{clientSecret}", lookup);
    } catch (error) {
      expect(String(error)).not.toContain("re_secret");
    }
  });
});
