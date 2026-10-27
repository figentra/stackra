/**
 * Stackra file contract:
 * Purpose: proves the `.` entry re-exports vitest's own runner objects (not copies) and every symbol the template
 *          and the registry row import.
 * Boundary: the stand-in barrel only; each helper has its own test beside it. The runner comes from vitest here, so
 *           the test does not lean on the barrel it checks.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 2); ADR 0294 (decision 15); ADR 0022 (test placement).
 */
import * as vitest from "vitest";
import { describe, expect, it } from "vitest";
import * as kit from "#core/index";

/** Each vitest name the kit hands back, beside vitest's own object. */
const RUNNER = {
  afterAll: [kit.afterAll, vitest.afterAll],
  afterEach: [kit.afterEach, vitest.afterEach],
  beforeAll: [kit.beforeAll, vitest.beforeAll],
  beforeEach: [kit.beforeEach, vitest.beforeEach],
  describe: [kit.describe, vitest.describe],
  expect: [kit.expect, vitest.expect],
  expectTypeOf: [kit.expectTypeOf, vitest.expectTypeOf],
  it: [kit.it, vitest.it],
  onTestFinished: [kit.onTestFinished, vitest.onTestFinished],
  test: [kit.test, vitest.test],
} as const;

/** The runtime symbols the template imports from `@stackra/testing`, beyond the runner. */
const KIT = {
  Fake: kit.Fake,
  createMatcher: kit.createMatcher,
  factory: kit.factory,
  freezeClock: kit.freezeClock,
  freezeIds: kit.freezeIds,
  testScopeId: kit.testScopeId,
  testScopeRef: kit.testScopeRef,
};

// @covers sta-348:FR-001
describe("the . entry", () => {
  it("re-exports vitest's runner objects themselves", () => {
    for (const [name, [ours, theirs]] of Object.entries(RUNNER)) expect(ours, name).toBe(theirs);
  });

  it("exports every runtime symbol the template imports from @stackra/testing", () => {
    for (const [name, value] of Object.entries(KIT)) expect(typeof value, name).toBe("function");
  });
});
