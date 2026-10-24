/**
 * Stackra file contract:
 * Purpose: `fakePlatform(options)`, a fresh memory platform for one test: handed to another package's test helper
 *          (`renderRoute(..., { platform })`, `render(..., { platform })`) or driven directly
 *          (`platform.scanner.emit("6281000000012")`, `platform.network.isOnline.set(false)`).
 * Boundary: test-only. It is the real memory driver, not a mock, so refusals and permissions behave as in the app;
 *           two calls never share state.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3: domain helpers in the owning package's ./testing), ADR 0266, ADR 0250.
 */
import { MemoryPlatformDriver, type MemoryPlatformOptions } from "#core/index";

/**
 * A memory platform with `options` applied.
 *
 * @example
 * const platform = fakePlatform({ scanner: { isAvailable: true, permission: "granted" } });
 * renderRoute(Routes.scan, { platform });
 * await act(() => platform.scanner.emit("6281000000012"));
 */
export function fakePlatform(options: MemoryPlatformOptions = {}): MemoryPlatformDriver {
  return new MemoryPlatformDriver().configure(options);
}
