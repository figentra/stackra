/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/testing (the vitest re-exports and the generic kit), which has
 *          several public files, until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Generic only: no workspace import and no domain type (ADR 0269
 *           decision 2). The vitest names are the consumer's own vitest, a peer dependency.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); ADR 0269 (decisions 2 and 4); the STA-347 stand-in barrel decision.
 */
export {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  expectTypeOf,
  it,
  onTestFinished,
  test,
} from "vitest";
export { Fake } from "#core/fake.fake";
export { createMatcher } from "#core/functions/create-matcher.function";
export { factory } from "#core/functions/factory.function";
export { freezeClock } from "#core/functions/freeze-clock.function";
export { freezeIds } from "#core/functions/freeze-ids.function";
export { testScopeId } from "#core/functions/test-scope-id.function";
export { testScopeRef } from "#core/functions/test-scope-ref.function";
export type { FactoryDefaults } from "#core/types/factory-defaults.type";
export type { FakeConstructor } from "#core/types/fake-constructor.type";
export type { FakeRecorder } from "#core/types/fake-recorder.type";
export type { FixtureBuilder } from "#core/types/fixture-builder.type";
export type { Matchers } from "#core/types/matchers.type";
export type { TestScopeRef } from "#core/types/test-scope-ref.type";
