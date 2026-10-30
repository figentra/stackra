/**
 * Stackra file contract:
 * Purpose: waits, after every test, for each dynamic import the test started (a lazy demo, the knobs playground, a
 *          hero) to finish loading, so none resolves after vitest has torn the test file's environment down.
 * Boundary: test support only; vitest loads it through `setupFiles` before every test file. Without an
 *           IntersectionObserver a page mounts its demos at once, so a test can end while their modules still load; one
 *           that resolved after teardown failed the suite with every test passed (EnvironmentTeardownError, STA-1674).
 * Runtime: browser
 * Governing contract: ADR 0022 (test placement); ADR 0182 (testing strategy).
 */
import { afterEach, vi } from "vitest";

afterEach(async () => {
  await vi.dynamicImportSettled();
});
