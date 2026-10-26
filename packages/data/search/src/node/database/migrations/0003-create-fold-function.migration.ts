/**
 * Stackra file contract:
 * Purpose: the third migration of the search package (`search.0003_create_fold_function`): `search.fold(text)`, the
 *          SQL mirror of `searchWordsOf` now that it folds Arabic through `@stackra/i18n`'s `normalizeArabic`: the
 *          `search.unaccent_immutable` folding plus the alef forms through canonical decomposition, the Quranic marks
 *          and the "al-" article stripped at the start of each word.
 * Boundary: a frozen snapshot, never edited once on main: it imports only @stackra/database and the function body is a
 *           literal. A new function rather than a replaced one: an expression index on `search.unaccent_immutable`
 *           stays valid until its model's migration builds the `search.fold` index beside it and drops the old one
 *           (expand and contract), so no index ever holds values its function no longer computes. Declared immutable
 *           so an expression index may call it; `search.unaccent_immutable` stays until no index names it (ADR 0404).
 * Runtime: node
 * Governing contract: ADR 0159 (as amended); ADR 0160 (no unapproved extension); ADR 0221 (decision 3 and its
 *                     2026-10-24 note); ADR 0404 (one Arabic normaliser and its reindex plan).
 */
import { Migration, type SchemaBuilder } from "@stackra/database";

/** Creates the unified folding function. */
export class CreateFoldFunctionMigration extends Migration {
  /** The function, with its inverse. */
  up(schema: SchemaBuilder): void {
    schema.sql(
      `create function search.fold(value text) returns text
language sql immutable strict parallel safe
as $$ select lower(regexp_replace(translate(normalize(regexp_replace(normalize(value, NFD), '[\\u0300-\\u036f\\u0610-\\u061a\\u0640\\u064b-\\u065f\\u0670\\u06d6-\\u06ed]', '', 'g'), NFC), U&'\\0671\\0649\\0629', U&'\\0627\\064a\\0647'), '(^|\\s)\\u0627\\u0644(?=\\S{2,})', '\\1', 'g')) $$`,
      { inverse: "drop function if exists search.fold(text)" },
    );
  }
}
