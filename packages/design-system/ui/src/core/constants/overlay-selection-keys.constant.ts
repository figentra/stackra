/**
 * Stackra file contract:
 * Purpose: `OVERLAY_SELECTION_KEYS`, the typed keys of the Popconfirm's, Menubar's, FloatingPanel's, Cascader's and
 *          TransferList's own words in `assets/lang/<locale>/ui.json` (`ui::popconfirm.*`, `ui::menubar.*`,
 *          `ui::floating_panel.*`, `ui::cascader.*`, `ui::transfer_list.*`).
 * Boundary: internal: the web and native components import it by path. Kept apart from `UI_KEYS` so the wave D
 *           components land without editing the shared key list; it folds into `UI_KEYS` when that is next touched.
 * Runtime: isomorphic
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0403 (seven languages); STA-1371
 *          (wave D, owner approval 2026-10-30).
 */
import { keys } from "@stackra/i18n";

/** The wave D overlay and selection components' keys. */
export const OVERLAY_SELECTION_KEYS = keys({
  ui: {
    popconfirm: ["confirm", "cancel"],
    menubar: ["label"],
    floating_panel: ["move", "move_hint", "resize", "resize_hint", "minimise", "restore", "close"],
    cascader: ["placeholder", "back", "loading", "empty"],
    transfer_list: [
      "available",
      "chosen",
      "filter",
      "add",
      "remove",
      "add_all",
      "remove_all",
      "empty",
      "moved",
    ],
  },
});
