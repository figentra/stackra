/**
 * Stackra file contract:
 * Purpose: `encryptedFieldContext`, the cipher context of one encrypted field, `<model key>.<field>`, which
 *          `EncryptedFieldsSubscriber` seals and opens under and `EncryptedFieldsResealService` re-seals under, so the
 *          two never disagree on where a sealed value belongs.
 * Boundary: derives the model key from the entity metadata's module schema and class name as gen's `modelKey` does
 *           (`<schema>.<snake(Class)>`); reads nothing else.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 20: a model's schema is its module key); ADR 0173; registry gap R-36 (owner
 *                     decision 23); gap gov7 (stackra-312).
 */

/** A module key, which a model's Postgres schema is (ADR 0294 decision 20). */
const MODULE_KEY = /^[a-z][a-z0-9_]*$/;

/**
 * The cipher context of `field`: `<model key>.<field>`.
 *
 * @param meta - the entity metadata's `schema` and `className`.
 * @throws TypeError when the entity has no module schema to derive its model key from.
 * @example
 * encryptedFieldContext({ schema: "crm", className: "CustomerContact" }, "email"); // "crm.customer_contact.email"
 */
export function encryptedFieldContext(
  meta: { readonly schema?: string | undefined; readonly className: string },
  field: string,
): string {
  const { schema } = meta;
  if (schema === undefined || !MODULE_KEY.test(schema))
    throw new TypeError(
      `${meta.className} has no module schema, so its encrypted fields have no cipher context`,
    );
  // the same snake_case gen's `modelKey` gives a class name
  const model = meta.className.replaceAll(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase();
  return `${schema}.${model}.${field}`;
}
