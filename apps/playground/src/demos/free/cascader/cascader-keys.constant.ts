/**
 * Stackra file contract:
 * Purpose: `CASCADER_KEYS`, the typed keys of the web Cascader demos' words in `assets/lang/<locale>/cascader.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The demos' keys. */
export const CASCADER_KEYS = keys({
  cascader: {
    areas: [
      "sa",
      "riyadh",
      "olaya",
      "malqa",
      "hittin",
      "jeddah",
      "rawdah",
      "hamra",
      "eastern",
      "dammam",
      "khobar",
      "ae",
      "dubai",
      "downtown",
      "marina",
      "abu_dhabi",
      "reem",
    ],
    basics: ["label", "description"],
    lazy: [
      "label",
      "description",
      "women",
      "men",
      "home",
      "abayas",
      "dresses",
      "thobes",
      "shoes",
      "kitchen",
      "bedding",
      "linen",
      "silk",
    ],
    invalid: ["label", "error"],
  },
});
