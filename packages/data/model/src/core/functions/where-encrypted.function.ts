/**
 * Stackra file contract:
 * Purpose: `whereEncrypted`, the filter that finds rows of a model whose encrypted lookup field equals a plain value:
 *          `{ <field>Bidx: blindIndexOf(value) }`, for `em.find`, a repository or `CrudService`.
 * Boundary: builds a filter only; reads no row. The field must be one of the model's `HasEncryptedFields({ lookup })`
 *           fields. The index is made under the scope's current key, so after a key rotation a row matches once
 *           `EncryptedFieldsResealService` has re-sealed it (its stale count reaches 0); until then such a row is
 *           missed, never wrongly matched. Exact equality only: normalise the value as it was written.
 * Runtime: node
 * Governing contract: ADR 0188 (decision 2); gap gov9 (stackra-313).
 */
import type { EntityManager } from "@mikro-orm/core";
import type { KeyProvider } from "@stackra/contracts";

import { blindIndexOf } from "#core/functions/blind-index-of.function";
import { blindIndexProperty } from "#core/functions/blind-index-property.function";
import { encryptedFieldContext } from "#core/functions/encrypted-field-context.function";
import { encryptedLookupOf } from "#core/functions/encrypted-lookup-of.function";

/**
 * The filter matching rows of `type` whose `field` equals `value`.
 *
 * @param em - the entity manager, for the model's metadata (its module schema).
 * @param keys - the scope's key provider, the one the subscriber indexes with.
 * @param type - the model class.
 * @param field - a lookup field of the model.
 * @param value - the plain value to find.
 * @throws TypeError when `field` keeps no blind index.
 * @example
 * const leads = await em.find(Lead, await whereEncrypted(em, keys, Lead, "email", "hala@example.com"));
 */
export async function whereEncrypted(
  em: EntityManager,
  keys: KeyProvider,
  type: { readonly name: string },
  field: string,
  value: string,
): Promise<Readonly<Record<string, string>>> {
  if (!encryptedLookupOf(type).includes(field))
    throw new TypeError(
      `${type.name}.${field} keeps no blind index; name it in HasEncryptedFields({ lookup })`,
    );
  const context = encryptedFieldContext(em.getMetadata(type as never), field);
  return { [blindIndexProperty(field)]: await blindIndexOf(keys, value, context) };
}
