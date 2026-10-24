/**
 * Stackra file contract:
 * Purpose: `fakeStorage()`, a fresh in-memory `Storage` for one test: handed to another package's test helper
 *          (`createStore(PreferencesStore, { storage })`, `renderRoute(..., { storage })`) or seeded directly
 *          (`storage.store(PreferencesStore).write({...})`).
 * Boundary: test-only. It is the real memory driver, not a mock, so expiry, schema checks and key lookup behave as in
 *           the app; two calls never share state.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3: domain helpers in the owning package's ./testing), ADR 0266, ADR 0256.
 */
import { MemoryStorageDriver } from "#core/index";

/**
 * An empty in-memory storage.
 *
 * @example
 * const storage = fakeStorage();
 * const first = await createStore(PreferencesStore, { storage });
 */
export function fakeStorage(): MemoryStorageDriver {
  return new MemoryStorageDriver();
}
