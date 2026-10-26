/**
 * Stackra file contract:
 * Purpose: `UI_KEYS`, the typed keys of this package's own texts in `assets/lang/<locale>/ui.json`: the words the web
 *          and native components show when their caller passes no label (back, close, more actions, pagination,
 *          filters, the data table's states).
 * Boundary: internal: the web and native entries import it by path; no entry exports it. Each key exists in every
 *           base locale this package ships (ar, en, fr, de, es, it, nl), which the catalogue-completeness check proves.
 * Runtime: isomorphic
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0403 (seven languages).
 */
import { keys } from "@stackra/i18n";

/** The ui package's own keys. */
export const UI_KEYS = keys({
  ui: {
    filter_bar: [
      "filters",
      "add",
      "done",
      "clear_all",
      "clear_search",
      "all_applied",
      "remove",
      "landmark",
      "applied",
      "yes",
      "no",
      "from",
      "until",
      "minimum",
      "maximum",
    ],
    date_field: ["empty", "done", "cancel", "unavailable"],
    date_picker: ["calendar"],
    section: ["more_actions"],
    page_header: ["more_actions"],
    navigation_list: ["label"],
    navigation_header: ["back"],
    tab_bar: ["label"],
    entity_picker: ["search", "close"],
    number_field: ["increment", "decrement"],
    bulk_action_bar: [
      "label",
      "selected",
      "clear",
      "select_all",
      "select_shown",
      "more_actions",
      "close",
    ],
    link: ["opens_in_browser", "opens_in_new_tab"],
    table: ["sort_by", "ascending", "descending", "loading", "selection_column"],
    cursor_pagination: ["label", "previous", "next", "load_more", "count"],
    app_shell: ["skip", "navigation", "close"],
    breadcrumbs: ["label"],
    property_list: ["copied"],
    sidebar: ["collapse", "expand"],
    data_table: [
      "loading",
      "actions_column",
      "row_actions",
      "working",
      "no_data_title",
      "no_data_description",
      "no_results_title",
      "no_results_description",
      "clear_filters",
      "error_title",
      "retry",
      "pagination",
      "bulk_actions",
    ],
    search_field: ["clear"],
  },
});
