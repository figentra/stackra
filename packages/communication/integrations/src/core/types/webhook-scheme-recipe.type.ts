/**
 * Stackra file contract:
 * Purpose: `WebhookSchemeRecipe`, the data of a provider webhook scheme that is not an HMAC over the raw body: where the
 *          token, signature or JWT sits (a header, a query parameter or a body path), which body fields are signed and
 *          in what order, the hash, and the headers an encrypted body's IV and tag travel in. One shape serves the
 *          `body_token`, `aes_gcm_body`, `ordered_field_hmac`, `keyed_field_digest`, `shared_header` and `jwt_hs256`
 *          codes of `@stackra/webhooks`' `SignatureScheme`; each reads only the fields its scheme names.
 * Boundary: a type only; `registerWebhookEvents` of `@stackra/webhooks` (which owns the codes) checks that the fields
 *           its scheme needs are present. Header names are lowercase; a path is dotted (`obj.order.id`). Vendor recipes
 *           are OS integrations data (ADR 0443 decision 7), never constants here.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rule 15); ADR 0224 (webhooks); ADR 0443 (decision 7); config-model (configuration,
 *                     not code).
 */

/**
 * A non-HMAC-body webhook scheme's recipe.
 *
 * @example
 * // an ordered-field HMAC: SHA-512 hex over the values of fixed body fields, the signature in `?hmac=`
 * const recipe: WebhookSchemeRecipe = {
 *   query: "hmac",
 *   fields: ["obj.amount_cents", "obj.created_at", "obj.currency", "obj.id"],
 *   algorithm: "SHA-512",
 * };
 */
export interface WebhookSchemeRecipe {
  /** The header that carries the token, signature or JWT (`authorization` reads a `Bearer` value). */
  readonly header?: string;

  /** The query parameter that carries the signature or JWT (`hmac`, `tamaraToken`). */
  readonly query?: string;

  /** The body path that carries the token or signature (`secret_token`, `messageSignature`). */
  readonly path?: string;

  /** The body paths whose values are signed, in the order they are joined (`ordered_field_hmac`, `keyed_field_digest`). */
  readonly fields?: readonly string[];

  /** The body paths whose numbers are written with a fixed count of decimals before joining (`paymentAmount: 2`). */
  readonly decimals?: Readonly<Record<string, number>>;

  /** The hash of an ordered-field HMAC or a keyed field digest. */
  readonly algorithm?: "SHA-256" | "SHA-512";

  /** The header that carries an encrypted body's hex IV (`x-initialization-vector`). */
  readonly ivHeader?: string;

  /** The header that carries an encrypted body's hex GCM tag (`x-authentication-tag`). */
  readonly tagHeader?: string;
}
