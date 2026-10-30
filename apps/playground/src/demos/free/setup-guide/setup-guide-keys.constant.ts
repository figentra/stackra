/**
 * Stackra file contract:
 * Purpose: `SETUP_GUIDE_KEYS`, the typed keys of the web SetupGuide demos' words in `assets/lang/<locale>/setup_guide.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The setup_guide namespace's keys. */
export const SETUP_GUIDE_KEYS = keys({
  setup_guide: {
    store: ["title", "done_title", "description"],
    pos: ["title", "description", "next_step", "restart"],
    task: [
      "product",
      "product_hint",
      "product_action",
      "payments",
      "payments_hint",
      "payments_action",
      "shipping",
      "shipping_action",
      "domain",
      "domain_action",
      "printer",
      "printer_hint",
      "staff",
      "staff_hint",
      "shift",
      "shift_hint",
    ],
    opened: ["product", "payments", "shipping", "domain"],
  },
});
