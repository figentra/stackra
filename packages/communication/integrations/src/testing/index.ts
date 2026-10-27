/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./testing` entry of @stackra/integrations (`fakeIntegrationApi`, `makeConnection`, the
 *          memory payroll, fulfilment-provider and accounting connectors, the recorded-case runner of accounting drivers
 *          (`replayIntegrationApi`, `runAccountingCase`), the recorded-case runners of every other connector driver
 *          (`runConnectorCase`, `runFulfilmentCase` for 3PL and WMS drivers), the memory ad platform, and the
 *          testing-module plugin that adds
 *          `.withIntegrationApi` and `.withConnection`) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Importing it registers the plugin with the testing module;
 *           `sideEffects` stays `false` because only vitest loads `./testing` and never tree-shakes it. Imports `.` and
 *           `@stackra/container/testing` only; no other package's `./testing` (ADR 0269 decision 3).
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); ADR 0269 (decision 3); the STA-347 stand-in barrel decision.
 */
export { MemoryAccountingConnector } from "#testing/accounting/memory-accounting.connector";
export { replayIntegrationApi } from "#testing/accounting/replay-integration-api.function";
export { runAccountingCase } from "#testing/accounting/run-accounting-case.function";
export type { AccountingCase } from "#testing/accounting/accounting-case.type";
export type { RecordedExchange } from "#testing/accounting/recorded-exchange.type";
export type { ReplayedIntegrationApi } from "#testing/accounting/replayed-integration-api.type";
export { MemoryAdPlatform } from "#testing/ads/memory-ad-platform.connector";
export { runConnectorCase } from "#testing/connectors/run-connector-case.function";
export { runFulfilmentCase } from "#testing/connectors/run-fulfilment-case.function";
export type { ConnectorCase } from "#testing/connectors/connector-case.type";
export type { ConnectorStep } from "#testing/connectors/connector-step.type";
export type { FulfilmentCase } from "#testing/connectors/fulfilment-case.type";
export { MemoryFulfilmentProvider } from "#testing/connectors/memory-fulfilment-provider.connector";
export { MemoryPayrollConnector } from "#testing/connectors/memory-payroll.connector";
export { INTEGRATIONS_TESTING_PLUGIN } from "#testing/constants/integrations-testing-plugin.constant";
export { fakeIntegrationApi } from "#testing/functions/fake-integration-api.function";
export { makeConnection } from "#testing/functions/make-connection.function";
export type { FakeAnswer } from "#testing/types/fake-answer.type";
export type { FakeIntegrationRoutes } from "#testing/types/fake-integration-routes.type";
export type { MakeConnectionOptions } from "#testing/types/make-connection-options.type";
export type { PathParams } from "#testing/types/path-params.type";
export type { TestConnection } from "#testing/types/test-connection.type";
