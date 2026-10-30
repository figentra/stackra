/**
 * Stackra file contract:
 * Purpose: `DOC_KEYS`, the typed keys of the doc-page chrome words the mobile doc screen reads from
 *          `showcase::doc.ui.*` (hero, pillars, guidance, RTL). Per-entry words are derived (`docKeys`, `categoryDocKeys`).
 * Boundary: keys only; the words live in `@stackra/showcase/assets/lang/<locale>/showcase.json`.
 * Runtime: react-native
 * Governing contract: ADR 0080 (typed i18n keys); STA-1371 (doc pages wave, 2026-10-28).
 */
import { keys } from "@stackra/i18n";

/** The doc-screen chrome keys. */
export const DOC_KEYS = keys({
  showcase: {
    doc: {
      ui: [
        "suggest",
        "pillar_what",
        "pillar_when",
        "pillar_how",
        "how_native",
        "tokens_count",
        "rtl_title",
        "guidance",
        "do",
        "dont",
        "when_not",
        "alternatives",
        "anatomy_parts",
      ],
    },
  },
});
