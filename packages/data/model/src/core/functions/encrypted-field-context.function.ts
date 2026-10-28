/**
 * Stackra file contract:
 * Purpose: `encryptedFieldContext`, the cipher context of one encrypted field, `<model key>.<field>` (with
 *          `@<scope id>` for a `HasEncryptedFields({ scope })` row), which
 *          `EncryptedFieldsSubscriber` seals and opens under and `EncryptedFieldsResealService` re-seals under, so the
 *          two never disagree on where a sealed value belongs.
 * Boundary: derives the model key from the entity metadata's module schema and class name as gen's `modelKey` does
 *           (`<schema>.<snake(Class)>`); the scope id is the caller's, read from the row. An empty scope id is
 *           refused: a value bound to no scope would open in every scope's row.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 20: a model's schema is its module key); ADR 0173; registry gap R-36 (owner
 *                     decision 23); gap gov7 (stackra-312); gap gov8 (stackra-330); ADR 0476.
 */

/** A module key, which a model's Postgres schema is (ADR 0294 decision 20). */
const MODULE_KEY = /^[a-z][a-z0-9_]*$/;

/**
 * The cipher context of `field`: `<model key>.<field>`, or `<model key>.<field>@<scope id>` for a scope-bound row.
 *
 * @param meta - the entity metadata's `schema` and `className`.
 * @param field - the encrypted field.
 * @param scopeId - the owning scope's id, for a `HasEncryptedFields({ scope })` model; omitted otherwise.
 * @throws TypeError when the entity has no module schema to derive its model key from, or `scopeId` is empty.
 * @example
 * encryptedFieldContext({ schema: "crm", className: "CustomerContact" }, "email"); // "crm.customer_contact.email"
 * encryptedFieldContext({ schema: "ai", className: "Message" }, "content", "scp_1"); // "ai.message.content@scp_1"
 */
export function encryptedFieldContext(
  meta: { readonly schema?: string | undefined; readonly className: string },
  field: string,
  scopeId?: string,
): string {
  const { schema } = meta;
  if (schema === undefined || !MODULE_KEY.test(schema))
    throw new TypeError(
      `${meta.className} has no module schema, so its encrypted fields have no cipher context`,
    );
  // the same snake_case gen's `modelKey` gives a class name
  const model = meta.className.replaceAll(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase();
  if (scopeId === undefined) return `${schema}.${model}.${field}`;
  if (scopeId === "")
    throw new TypeError(
      `${meta.className}.${field} is bound to its row's scope, so the row must hold the scope's id`,
    );
  return `${schema}.${model}.${field}@${scopeId}`;
}
