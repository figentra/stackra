/**
 * Stackra file contract:
 * Purpose: `AppMessages`, a locale's merged catalogues as the runtime carries them from the wiring's `messages`
 *          loader to the i18n context: the shape @stackra/i18n formats from.
 * Boundary: a type only, read off `formatMessage`'s first parameter, so the core entry takes no type from the i18n
 *           package's React entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0080 (catalogues); ADR 0295 (decision 10).
 */
import type { formatMessage } from "@stackra/i18n";

/** The catalogues of one locale, by namespace. */
export type AppMessages = Parameters<typeof formatMessage>[0];
