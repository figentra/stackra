/**
 * Stackra file contract:
 * Purpose: `PERMISSIONS_MATRIX_KEYS`, the typed keys of the `PermissionsMatrix`'s own words in
 *          `assets/lang/<locale>/ui.json` (`ui::permissions_matrix.*`): the column title, the checkboxes' names, the
 *          read-only cells and a role's summary.
 * Boundary: keys only; internal. Kept beside `UI_KEYS` so parallel builds never edit that file; fold it in later.
 * Runtime: isomorphic
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0403 (seven languages).
 */
import { keys } from "@stackra/i18n";

/** The permissions matrix's keys. */
export const PERMISSIONS_MATRIX_KEYS = keys({
  ui: {
    permissions_matrix: [
      "permission",
      "all_for_role",
      "group_for_role",
      "cell",
      "cell_state",
      "allowed",
      "denied",
      "summary",
    ],
  },
});
