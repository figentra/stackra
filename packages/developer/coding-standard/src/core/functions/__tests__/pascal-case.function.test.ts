/**
 * Stackra file contract:
 * Purpose: unit tests of `pascalCase`: one word, several words and the kind suffixes of the kind table.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing).
 */
import { describe, expect, it } from "@stackra/testing";

import { pascalCase } from "#core/functions/pascal-case.function";

describe("pascalCase", () => {
  it.each([
    ["action", "Action"],
    ["state-machine", "StateMachine"],
    ["extension-point", "ExtensionPoint"],
    ["analytics-event", "AnalyticsEvent"],
  ])("pascalCase(%j) is %j", (kebab, expected) => {
    expect(pascalCase(kebab)).toBe(expected);
  });
});
