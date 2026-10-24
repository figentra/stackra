/**
 * Stackra file contract:
 * Purpose: `fakeColorScheme(options)`, a `ColorSchemeService` for one test, seeded with a chosen scheme and a system
 *          preference: bound in place of the service (the testing module's `.override(ColorSchemeService, fake)`, the
 *          `theme` option of a render or shortcut helper) or used directly.
 * Boundary: a real service over in-memory storage and the memory system driver, so validation, persistence and
 *           notification behave as in the app; two calls never share state. The scheme is set through `setScheme`, so
 *           a scheme the configuration does not offer throws here, as it would in the app.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3: domain helpers in the owning package's ./testing); ADR 0266.
 */
import { buildConfig } from "@stackra/config";
import { MemoryStorageDriver } from "@stackra/storage";

import { ColorSchemeService, MemorySystemColorSchemeDriver, ThemingConfig } from "#core/index";
import type { FakeColorSchemeOptions } from "#testing/types/fake-color-scheme-options.type";

/**
 * A colour scheme service seeded for a test.
 *
 * @throws RangeError when `options.scheme` is not one of the configuration's schemes.
 * @example
 * const colorScheme = fakeColorScheme({ scheme: ColorScheme.System, system: "dark" });
 * colorScheme.state().resolved; // "dark"
 */
export function fakeColorScheme(options: FakeColorSchemeOptions = {}): ColorSchemeService {
  const service = new ColorSchemeService(
    options.config ?? buildConfig(ThemingConfig),
    new MemoryStorageDriver(),
    new MemorySystemColorSchemeDriver().set(options.system ?? "light"),
  );
  if (options.scheme !== undefined) service.setScheme(options.scheme);
  return service;
}
