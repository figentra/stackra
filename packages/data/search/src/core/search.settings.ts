/**
 * Stackra file contract:
 * Purpose: `SearchSettings`, the runtime search settings an admin edits per scope without a deploy: `synonyms`, the
 *          synonym sets of each index and language (`products en: sofa, couch, settee`, one set per line).
 * Boundary: this package's one settings group; its key is `search` and its setting `search.synonyms`. A setting value
 *           is a scalar, so the sets are one text in the line form `SEARCH_SYNONYM_LINE` describes, and the schema
 *           refuses a text with a line that breaks it. Resolved through the settings cascade: the platform's default,
 *           then a scope node below (the level tenancy contributes, never named here, R-59). `SearchIndex` reads it on
 *           each find, page and facet count and adds the sets as alternatives of the phrase words. Never a secret.
 *           It registers its schema when the module loads (STA-339 replaces the registration).
 * Runtime: isomorphic
 * Governing contract: ADR 0221 (decision 3); ADR 0307 (rules 22 to 24); ADR 0294 (decisions 16 and 20); ADR 0323;
 *                     ADR 0403 (per-language analysis).
 */
import { SettingScope, Settings } from "@stackra/settings";
import { registerSchemas, Str } from "@stackra/validation";
import { z } from "zod";

import { SEARCH_SYNONYM_LINE } from "#core/constants/search-synonym-line.constant";

/** The longest synonyms text, which bounds what one read parses. */
const MAX_SYNONYMS_LENGTH = 20_000;

/**
 * The search settings.
 *
 * @example
 * const { synonyms } = await this.settings.get(SearchSettings);
 */
export class SearchSettings extends Settings({
  scopes: [SettingScope.Platform, SettingScope.Node],
}) {
  /** Synonym sets, one per line: `<index> <language>: term, term[, term...]`; `#` starts a comment line. */
  @Str({ max: MAX_SYNONYMS_LENGTH })
  synonyms = "";
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [
    SearchSettings,
    z.object({
      synonyms: z
        .string()
        .max(MAX_SYNONYMS_LENGTH)
        .refine((text) => text.split("\n").every((line) => SEARCH_SYNONYM_LINE.test(line)))
        .default(""),
    }),
  ],
]);
