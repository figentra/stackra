/**
 * Stackra file contract:
 * Purpose: unit tests of `readIntegrationOptions` for `baseUrl`: a literal http(s) URL and an https template are
 *          accepted, a single `{field}` that is the whole URL is accepted, and an http template is refused.
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
