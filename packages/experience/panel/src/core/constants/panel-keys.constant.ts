/**
 * Stackra file contract:
 * Purpose: `PANEL_KEYS`, the typed keys of this package's own texts in `assets/lang/<locale>/panel.json`: the tile
 *          states, the range picker and its periods, the trend and target lines, and the action runner's dialog and
 *          toasts, and the plan-catalogue admin's versions, decisions and proposal form,
 *          and the onboarding checklist.
 * Boundary: internal: the web and native entries import it by path; no entry exports it. Each key exists in every base
 *           locale this package ships (ar, en, fr, de, es, it, nl).
 * Runtime: isomorphic
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0139 (declared confirmation).
 */
import { keys } from "@stackra/i18n";

/** The panel's own keys. */
export const PANEL_KEYS = keys({
  panel: {
    widgets: ["empty", "failed", "retry", "range", "change", "target", "not_rendered"],
    time_range: ["today", "yesterday", "last_7_days", "last_30_days", "this_month", "custom"],
    actions: ["confirm_title", "confirm", "cancel", "done", "refused"],
    checklist: [
      "title",
      "progress",
      "complete",
      "open",
      "mark_done",
      "done",
      "hide",
      "move_up",
      "move_down",
      "locked",
    ],
    plan_catalogue: [
      "history",
      "version",
      "effective_from",
      "in_force",
      "none_in_force",
      "discount",
      "proposed_by",
      "decided_by",
      "approve",
      "reject",
      "withdraw",
      "own_proposal",
      "propose",
      "rows",
      "row",
      "add_row",
      "remove_row",
      "mark_discount",
      "discount_detected",
      "renewal",
      "submit",
      "invalid",
      "unlimited",
      "state_pending",
      "state_approved",
      "state_rejected",
    ],
  },
});
