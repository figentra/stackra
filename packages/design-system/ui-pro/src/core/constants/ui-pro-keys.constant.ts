/**
 * Stackra file contract:
 * Purpose: `UI_PRO_KEYS`, the typed keys of this package's own texts in `assets/lang/<locale>/ui_pro.json`: the
 *          status words of approvals, plan steps and scheduler views, and the default names of the chat, code block,
 *          navbar, sidebar and table-of-contents buttons, and
 *          the screen-reader actions of a scheduler booking, and where a workflow canvas node leads.
 * Boundary: internal; the web and native entries import it by path. Each key exists in every base locale this package
 *           ships, which the catalogue-completeness check proves.
 * Runtime: isomorphic
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0403 (seven languages).
 */
import { keys } from "@stackra/i18n";

/** The ui-pro package's own keys. */
export const UI_PRO_KEYS = keys({
  ui_pro: {
    enums: {
      approval_status: ["pending", "approved", "rejected", "escalated"],
      plan_step_status: ["pending", "running", "done", "failed", "skipped"],
      scheduler_view: ["day", "week"],
    },
    chat: ["scroll_to_latest", "attach_files", "remove_attachment", "loading_reply"],
    code_block: ["copy", "copied"],
    navbar: ["open_menu", "close_menu"],
    sidebar: ["toggle", "resize"],
    table_of_contents: ["on_this_page"],
    scheduler: ["move_earlier", "move_later", "move_previous", "move_next", "lengthen", "shorten"],
    workflow_canvas: ["leads_to"],
  },
});
