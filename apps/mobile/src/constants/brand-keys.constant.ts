/**
 * Stackra file contract:
 * Purpose: `BRAND_KEYS`, the typed keys of the app's `brand` catalogue: the product name (ستاكرا in Arabic), the
 *          tagline, the one-line pitch, the two calls to action and the copy of the three landing heroes (`hero`).
 * Boundary: keys only; the words live in `assets/lang/<locale>/brand.json` (the name and tagline as the brand's
 *           brand.json at the pinned sha states them). A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); STA-1371.
 */
import { keys } from "@stackra/i18n";

/** The brand namespace's keys. */
export const BRAND_KEYS = keys({
  brand: {
    _: ["name", "tagline", "pitch", "browse", "theme"],
    hero: {
      _: ["menu", "pause", "play", "count", "money", "money_whole"],
      status: ["paid", "pending", "shipped"],
      stack: [
        "name",
        "eyebrow",
        "tokens",
        "components",
        "products",
        "pitch",
        "assemble",
        "explode",
        "layer_tokens",
        "layer_components",
        "layer_product",
        "publish",
        "preview",
        "search",
        "orders_today",
        "orders",
        "revenue",
        "returns",
      ],
      storm: [
        "name",
        "eyebrow",
        "title",
        "title_accent",
        "pitch",
        "themes",
        "play",
        "revenue",
        "this_week",
        "notifications",
        "person",
        "person_note",
        "plan",
        "team",
        "free",
        "email",
        "deploy",
        "deploy_note",
        "ship",
      ],
      mirror: [
        "name",
        "direction",
        "eyebrow",
        "title",
        "title_accent",
        "pitch",
        "studio",
        "pause",
        "play",
        "orders",
        "new_order",
        "search",
        "order",
        "person_1",
        "person_2",
        "person_3",
      ],
    },
  },
});
