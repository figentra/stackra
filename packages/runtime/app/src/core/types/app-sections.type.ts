/**
 * Stackra file contract:
 * Purpose: `AppSections`, the sections of a generated wiring that @stackra/app owns and reads: the context keys the
 *          client mounts and the catalogue loader of the member's locales.
 * Boundary: a type only. `Wiring` is open for sections their package owns (ADR 0263 decision 11), so gen writes these
 *           beside the container's sections and the wiring still `satisfies Wiring`.
 * Runtime: isomorphic
 * Governing contract: ADR 0295 (decisions 7 and 10); ADR 0263 (decision 11); ADR 0080 (catalogues).
 */
import type { Locale } from "@stackra/i18n";

import type { AppMessages } from "#core/types/app-messages.type";

/** The wiring sections @stackra/app reads. */
export interface AppSections {
  /**
   * The context keys `Contexts` mounts, outermost first (`["feature_flags", "theming", "i18n", ..., "ui"]`). When
   * absent, the module keys of the graph that have a registered context are mounted, in graph order.
   */
  readonly contexts?: readonly string[];

  /** Loads one locale's merged catalogues: gen's `loadMessages` over the member's namespaces. Client targets only. */
  readonly messages?: (locale: Locale) => Promise<AppMessages>;
}
