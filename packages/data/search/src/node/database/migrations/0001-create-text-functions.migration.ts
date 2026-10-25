/**
 * Stackra file contract:
 * Purpose: the first migration of the search package (`search.0001_create_text_functions`): the trigram extension and
 *          `search.unaccent_immutable(text)`, the folding function a model's trigram index is built on.
 * Boundary: a frozen snapshot, never edited once on main: it imports only @stackra/database and the function body is a
 *           literal. The function folds as `searchWordsOf` does (canonical decomposition, accents, tatweel and tashkeel
 *           removed, alef wasla, alef maqsura and teh marbuta unified, lower case) with no unapproved extension, and is
 *           declared immutable so an expression index may call it. It lives in the package's own schema (`search`),
 *           which gen creates first. A model's migration names this one in `after:` when its index calls the function.
 * Runtime: node
 * Governing contract: ADR 0159 (as amended); ADR 0160 and ADR 0334 rule 3 (approved extensions through
 *                     `createExtension`); ADR 0221 (decisions 1 and 3).
 */
import { Extension, Migration, type SchemaBuilder } from "@stackra/database";

/** Creates the extension and the folding function. */
export class CreateTextFunctionsMigration extends Migration {
  /** The extension, then the function with its inverse. */
  up(schema: SchemaBuilder): void {
    schema.createExtension(Extension.Trigram);
    schema.sql(
      `create function search.unaccent_immutable(value text) returns text
language sql immutable strict parallel safe
as $$ select lower(translate(normalize(regexp_replace(normalize(value, NFD), '[\\u0300-\\u036f\\u0640\\u064b-\\u065f\\u0670]', '', 'g'), NFC), U&'\\0671\\0649\\0629', U&'\\0627\\064a\\0647')) $$`,
      { inverse: "drop function if exists search.unaccent_immutable(text)" },
    );
  }
}
