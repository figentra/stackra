/**
 * Stackra file contract:
 * Purpose: unit tests of `snakeCase`: PascalCase, camelCase, kebab-case, dotted and spaced names, with acronyms cased
 *          as words.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0231 (snake_case codes, acronyms as words).
 */
import { describe, expect, it } from "@stackra/testing";

import { snakeCase } from "#core/functions/snake-case.function";

describe("snakeCase", () => {
  it("converts every naming form to snake_case", () => {
    expect(snakeCase("OrderLine")).toBe("order_line");
    expect(snakeCase("attachImage")).toBe("attach_image");
    expect(snakeCase("loyalty-kit")).toBe("loyalty_kit");
    expect(snakeCase("order.paid")).toBe("order_paid");
    expect(snakeCase("access log entry")).toBe("access_log_entry");
    expect(snakeCase("ApiClient2Factory")).toBe("api_client2_factory");
    expect(snakeCase("already_snake")).toBe("already_snake");
  });
});
