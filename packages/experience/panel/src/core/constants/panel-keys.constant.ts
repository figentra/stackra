/**
 * Stackra file contract:
 * Purpose: `PANEL_KEYS`, the typed keys of this package's own texts in `assets/lang/<locale>/panel.json`: the tile
 *          states, the range picker and its periods, the trend lines (relative, and in percentage points for a rate)
 *          and the target line, and the action runner's dialog and toasts, and the plan-catalogue admin's versions,
 *          decisions and proposal form,
 *          and the onboarding checklist, and the generic resource pages (search, create, view, edit, delete, save, the
 *          load failure, the empty list, the trashed filter, the row count, a flag's yes or no, a list field's add and
 *          remove, a JSON field's parse error, a map's key and value, a date and time's parts and time zone), and the
 *          search palette, and the chat's action form (send, sent, loading, unavailable and its file field).
 * Boundary: internal: the web and native entries import it by path; no entry exports it. Each key exists in every base
 *           locale this package ships (ar, en, fr, de, es, it, nl).
 * Runtime: isomorphic
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0139 (declared confirmation).
 */
import { keys } from "@stackra/i18n";

/** The panel's own keys. */
export const PANEL_KEYS = keys({
  panel: {
    widgets: [
      "empty",
      "failed",
      "retry",
      "range",
      "change",
      "change_points",
      "target",
      "not_rendered",
    ],
    time_range: ["today", "yesterday", "last_7_days", "last_30_days", "this_month", "custom"],
    actions: ["confirm_title", "confirm", "cancel", "done", "refused"],
    resources: [
      "search",
      "create",
      "view",
      "edit",
      "delete",
      "save",
      "failed",
      "retry",
      "empty",
      "trashed",
      "trashed_with",
      "trashed_only",
      "all_views",
      "saved_views",
      "count",
      "count_capped",
      "yes",
      "no",
      "add_item",
      "remove_item",
      "invalid_json",
      "record_key",
      "record_value",
      "date_part",
      "hour",
      "minute",
      "time_zone",
    ],
    search_palette: ["label", "placeholder", "empty", "loading", "failed"],
    chat_form: [
      "send",
      "sent",
      "loading",
      "unavailable",
      "upload",
      "uploading",
      "upload_failed",
      "no_upload",
    ],
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
