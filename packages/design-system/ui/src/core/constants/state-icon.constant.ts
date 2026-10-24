/**
 * Stackra file contract:
 * Purpose: the icon each EmptyState reason and ErrorState kind draws when the caller gives none: an inbox for nothing
 *          yet, a crossed search for no results, a lock for permission denied and for signing in, a ban for forbidden,
 *          a question mark on a page for not found and a warning triangle for the rest.
 * Boundary: data only, names from `@stackra/icons`; each runtime's `state-icons.constant.ts` registers the drawings
 *           of exactly these names, so a state shows its icon with nothing registered by the app. Internal, not in
 *           the `.` barrel: `react/` and `native/` import it by path.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 10); ADR 0313 (decision 6); WCAG 2.2 SC 1.4.1.
 */
import type { IconName } from "@stackra/icons/contracts";

import type { EmptyReason } from "#contracts/enums/empty-reason.enum";
import type { ErrorKind } from "#contracts/enums/error-kind.enum";

/** The default icon of each reason and kind, by name. */
export const STATE_ICON = Object.freeze({
  "no-data": "inbox",
  "no-results": "search-x",
  "permission-denied": "lock",
  unauthenticated: "log-in",
  forbidden: "ban",
  "not-found": "file-question-mark",
  unexpected: "triangle-alert",
} as const satisfies Record<EmptyReason | ErrorKind, IconName>);
