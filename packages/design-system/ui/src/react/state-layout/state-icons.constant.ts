/**
 * Stackra file contract:
 * Purpose: the web drawings of the icons `STATE_ICON` names (inbox, search-x, lock, log-in, ban, file-question-mark,
 *          triangle-alert), registered here so an EmptyState or ErrorState shows its icon with nothing registered by
 *          the app.
 * Boundary: a registry of named re-exports, so a bundler keeps only these; `StateLayout` hands it to the icons below
 *           it through a nested `IconRegistryProvider`, so it never touches the shared `UI_ICONS`.
 * Runtime: browser
 * Governing contract: ADR 0303 (decision 10); ADR 0313 (decision 6); ADR 0183 (budgets).
 */
import { defineIconRegistry } from "@stackra/icons";
import {
  Ban,
  FileQuestionMark,
  Inbox,
  Lock,
  LogIn,
  SearchX,
  TriangleAlert,
} from "@stackra/icons/react/lucide-icons";

/** The icons the web state components draw on their own. */
export const STATE_ICONS = defineIconRegistry({
  ban: Ban,
  "file-question-mark": FileQuestionMark,
  inbox: Inbox,
  lock: Lock,
  "log-in": LogIn,
  "search-x": SearchX,
  "triangle-alert": TriangleAlert,
});
