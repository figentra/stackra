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

// The hook gets the tests' 30 s-class budget: under a loaded runner settling every lazy demo took past vitest's 10 s
// hook default, the hook failed, cleanup never ran and the next test saw two pages.
afterEach(async () => {
  await vi.dynamicImportSettled();
}, 60_000);
