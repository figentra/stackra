/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./testing` entry of @stackra/integrations (`fakeIntegrationApi`, `makeConnection` and
 *          the testing-module plugin that adds `.withIntegrationApi` and `.withConnection`) until `stackra gen` writes
 *          the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Importing it registers the plugin with the testing module;
 *           `sideEffects` stays `false` because only vitest loads `./testing` and never tree-shakes it. Imports `.` and
 *           `@stackra/container/testing` only; no other package's `./testing` (ADR 0269 decision 3).
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); ADR 0269 (decision 3); the STA-347 stand-in barrel decision.
 */
export { INTEGRATIONS_TESTING_PLUGIN } from "#testing/constants/integrations-testing-plugin.constant";
export { fakeIntegrationApi } from "#testing/functions/fake-integration-api.function";
export { makeConnection } from "#testing/functions/make-connection.function";
export type { FakeAnswer } from "#testing/types/fake-answer.type";
export type { FakeIntegrationRoutes } from "#testing/types/fake-integration-routes.type";
export type { MakeConnectionOptions } from "#testing/types/make-connection-options.type";
export type { PathParams } from "#testing/types/path-params.type";
export type { TestConnection } from "#testing/types/test-connection.type";
