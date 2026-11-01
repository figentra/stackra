/**
 * Stackra file contract:
 * Purpose: unit tests of `readIntegrationOptions` for `baseUrl`: a literal http(s) URL and an https template are
 *          accepted, a single `{field}` that is the whole URL is accepted, and an http template is refused; a written
 *          `key` of two snake_case parts is kept, any other is refused (STA-1739).
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0308 (rule 6); STA-1665.
 */
import { describe, expect, it } from "@stackra/testing";

import { AuthType } from "#core/enums/auth-type.enum";
import { IntegrationCategory } from "#core/enums/integration-category.enum";
import { readIntegrationOptions } from "#core/functions/read-integration-options.function";

const read = (baseUrl: string) =>
  readIntegrationOptions({
    provider: "tools",
    category: IntegrationCategory.Other,
    levels: [],
    auth: { type: AuthType.None },
    baseUrl,
  });

describe("readIntegrationOptions baseUrl", () => {
  it("accepts a whole-URL placeholder", () => {
    expect(read("{baseUrl}").baseUrl).toBe("{baseUrl}");
  });

  it("refuses an http template", () => {
    expect(() => read("http://{host}")).toThrow(/baseUrl/);
  });

  it("leaves a literal URL and an https template unchanged", () => {
    expect(read("http://speech.internal:8080").baseUrl).toBe("http://speech.internal:8080");
    expect(read("https://{host}/api").baseUrl).toBe("https://{host}/api");
  });
});

const keyed = (key: string) =>
  readIntegrationOptions({
    key,
    provider: "stripe",
    category: IntegrationCategory.Other,
    levels: [],
    auth: { type: AuthType.None },
  });

describe("readIntegrationOptions key (STA-1739)", () => {
  it("keeps a written key of two snake_case parts", () => {
    expect(keyed("connectors.stripe").key).toBe("connectors.stripe");
    expect(keyed("connectors.amazon_payment_services").key).toBe(
      "connectors.amazon_payment_services",
    );
  });

  it.each(["stripe", "connectors.stripe.v2", "Connectors.stripe", "connectors.noon-pay", ""])(
    "refuses the key %j",
    (key) => {
      expect(() => keyed(key)).toThrow(/key/);
    },
  );
});
