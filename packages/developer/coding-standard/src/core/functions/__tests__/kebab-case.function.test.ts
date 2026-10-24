/**
 * Stackra file contract:
 * Purpose: unit tests of `kebabCase`: camelCase, PascalCase, digits and acronym runs cased as one word.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing).
 */
import { describe, expect, it } from "@stackra/testing";

import { kebabCase } from "#core/functions/kebab-case.function";

describe("kebabCase", () => {
  it.each([
    ["useRunShortcut", "use-run-shortcut"],
    ["CancelOrderAction", "cancel-order-action"],
    ["useI18n", "use-i18n"],
    ["use2Fa", "use2-fa"],
    ["loadHTTPUrl", "load-http-url"],
    ["useURL", "use-url"],
    ["cart", "cart"],
  ])("kebabCase(%j) is %j", (identifier, expected) => {
    expect(kebabCase(identifier)).toBe(expected);
  });
});
