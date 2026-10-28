/**
 * Stackra file contract:
 * Purpose: `AlternatesContext`, what `alternates` reads from a route context: the site's origin and the i18n
 *          configuration (locales, default, URL strategy).
 * Boundary: a type only; the navigation package's route context satisfies it structurally, so client and server route
 *           code pass `ctx` as it is.
 * Runtime: isomorphic
 * Governing contract: ADR 0301 (decision 6); ADR 0297 (decision 4).
 */
import type { I18nConfig } from "@stackra/i18n";

/** The parts of a route context that alternates are built from. */
export interface AlternatesContext {
  /** The request's site; only its canonical origin is read. */
  readonly site: { readonly origin: string };
  /** Reads a configuration from the container; called with `I18nConfig`. */
  config: (
    type: typeof I18nConfig,
  ) => Pick<I18nConfig, "locales" | "defaultLocale" | "urlStrategy">;
}
