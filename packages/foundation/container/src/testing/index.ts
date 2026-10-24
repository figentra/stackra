/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./testing` entry of @stackra/container (the testing module, its plugin extension
 *          point and wiring registration), which has several public files, until `stackra gen` writes the entry
 *          barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Imports `.` only; no other package's `./testing` (ADR 0269
 *           decision 3).
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); ADR 0269 (decision 3); the STA-347 stand-in barrel decision.
 */
export { createTestingModule } from "#testing/functions/create-testing-module.function";
export { registerTestingPlugin } from "#testing/functions/register-testing-plugin.function";
export { registerWiring } from "#testing/functions/register-wiring.function";
export { TestingApp } from "#testing/services/testing-app.service";
export { TestingModuleBuilder } from "#testing/services/testing-module-builder.service";
export type { ModuleRecord } from "#testing/types/module-record.type";
export type { TestingPlugin } from "#testing/types/testing-plugin.type";
