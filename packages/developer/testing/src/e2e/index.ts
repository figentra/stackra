/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./e2e` entry of @stackra/testing (the end-to-end tier over Playwright: `test` with the
 *          API-call recorder, `expect` with `toHaveNoViolations`, `axe`, `apiCalls`, `seed`, `loginAs`, `evictShell`,
 *          `launchDesktop`, and the config preset `e2ePreset`) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Runs in the Playwright runner only, never under vitest or in a
 *           bundle; `@playwright/test` and `@axe-core/playwright` are optional peers. No workspace import.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); ADR 0269 (decision 6); ADR 0183 (decision 2); the STA-347 stand-in barrel
 *                     decision.
 */
export type { ApiCall } from "#e2e/api-calls/api-call.type";
export { apiCalls } from "#e2e/api-calls/api-calls.function";
export { axe } from "#e2e/axe/axe.function";
export type { AxeReport } from "#e2e/axe/axe-report.type";
export { E2E_CONTROL } from "#e2e/control/e2e-control.constant";
export { e2ePreset } from "#e2e/e2e-preset/e2e-preset.function";
export type { E2ePresetOptions } from "#e2e/e2e-preset/e2e-preset-options.type";
export type { E2eProject } from "#e2e/e2e-preset/e2e-project.type";
export { evictShell } from "#e2e/evict-shell/evict-shell.function";
export { expect } from "#e2e/expect/expect.constant";
export type { DesktopApp } from "#e2e/launch-desktop/desktop-app.type";
export { launchDesktop } from "#e2e/launch-desktop/launch-desktop.function";
export type { LaunchDesktopOptions } from "#e2e/launch-desktop/launch-desktop-options.type";
export { loginAs } from "#e2e/login-as/login-as.function";
export type { TestActor } from "#e2e/login-as/test-actor.type";
export { seed } from "#e2e/seed/seed.function";
export { test } from "#e2e/test/test.constant";
