/**
 * Stackra file contract:
 * Purpose: `refuseEncryptedSearchPath`, the runtime guard that keeps a field resting encrypted out of the search index:
 *          a `@Searchable` path that ends at a field its owner names with `HasEncryptedFields` is refused, because the
 *          loaded row holds that field opened, so its plain text would reach the index, the embedder and the snippets.
 * Boundary: pure over the row it is given. It walks the path through the row's populated relations (as
 *           `searchValuesAt` reads them) and checks the field the path ends at on every owner reached, so a field of a
 *           package model gen could not see is refused here too; an empty relation reaches no owner and passes. It
 *           reads the trait registry through `encryptedFieldsOf`, never the value, and never opens or seals anything.
 * Runtime: isomorphic
 * Governing contract: ADR 0465 (decision 5: the model encryption path); ADR 0294 (decision 27); ADR 0221 (decisions 1
 *                     to 3); ADR 0380 (decision 3: the code floor); STA-2241.
 */
import { encryptedFieldsOf } from "@stackra/model";

import { searchValuesAt } from "#core/functions/search-values-at.function";

/**
 * Refuses `path` on `row` when it ends at a field that rests encrypted on any owner it reaches.
 *
 * @param row - a loaded row whose relations on the path are populated.
 * @param path - a dotted `@Searchable` path (a text, filter, sortable or range field).
 * @throws TypeError naming the model and path, with the gen code `searchable_field_encrypted`.
 * @example
 * refuseEncryptedSearchPath(patient, "allergies"); // throws: Patient encrypts allergies
 */
export function refuseEncryptedSearchPath(row: object, path: string): void {
  const keys = path.split(".");
  const last = keys.pop() ?? "";
  const owners = keys.length === 0 ? [row] : searchValuesAt(row, keys.join("."));
  for (const owner of owners) {
    if (typeof owner !== "object" || owner === null) continue;
    if (!encryptedFieldsOf(owner.constructor).includes(last)) continue;
    throw new TypeError(
      `searchable_field_encrypted: ${row.constructor.name}.${path} ends at ${owner.constructor.name}.${last}, which ` +
        "HasEncryptedFields keeps sealed at rest, so @Searchable may not index, embed or excerpt its plain text",
    );
  }
}
