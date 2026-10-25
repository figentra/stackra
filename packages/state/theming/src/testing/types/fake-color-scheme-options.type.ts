/**
 * Stackra file contract:
 * Purpose: `FakeColorSchemeOptions`, what `fakeColorScheme()` takes: the chosen scheme, the system preference and the
 *          theming configuration a test starts from.
 * Boundary: a type only; every field is optional and falls back to the package defaults.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); ADR 0294 (decision 8).
 */
import type { ColorScheme, ResolvedColorScheme } from "@stackra/ui/contracts";

import type { ThemingConfig } from "#core/index";

/** The starting point of a fake colour scheme. */
export interface FakeColorSchemeOptions {
  /** The chosen scheme; the configuration's `defaultScheme` when left out. */
  readonly scheme?: ColorScheme;

  /** The system preference `system` resolves to; `light` when left out. */
  readonly system?: ResolvedColorScheme;

  /** The theming configuration (a host override, built); the defaults when left out. */
  readonly config?: ThemingConfig;
}
