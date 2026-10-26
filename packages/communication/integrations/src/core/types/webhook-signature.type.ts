/**
 * Stackra file contract:
 * Purpose: `WebhookSignature`, the recipe of a provider's HMAC webhook signature as Integration data: the header that
 *          carries it, its layout, the hash, the encoding, how the secret becomes the key, the text that was signed and
 *          how far its timestamp may drift. `@stackra/webhooks` verifies any recipe with one mechanism, so a provider
 *          whose scheme is an HMAC over the body needs data here, never a new verifier.
 * Boundary: a type only; `readIntegrationOptions` checks it when the Integration is declared and the `hmac` scheme of
 *           `@stackra/webhooks` reads it. Header names are lowercase. Only a recipe the provider publishes goes here;
 *           a provider that signs fields of the body in its own order, encrypts the body or sends a token instead has
 *           no recipe and is verified by lookup.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rule 15); ADR 0224 (webhooks); config-model (configuration, not code).
 */
import type { Interval } from "#core/types/interval.type";

/**
 * An HMAC signature recipe.
 *
 * @example
 * // Stripe: `stripe-signature: t=1700000000,v1=<hex>`, signed `<t>.<body>`, five minutes either way
 * const stripe: WebhookSignature = {
 *   header: "stripe-signature",
 *   parts: { separator: ",", assign: "=", signature: "v1", timestamp: "t" },
 *   algorithm: "SHA-256",
 *   encoding: "hex",
 *   payload: "{timestamp}.{body}",
 *   tolerance: "5m",
 * };
 */
export interface WebhookSignature {
  /** The header that carries the signature, lowercase (`stripe-signature`, `cko-signature`). */
  readonly header: string;

  /**
   * The header's layout when it holds several parts (`t=…,v1=…,v1=…`): the separator between parts, the one between a
   * part's name and value, the name of each signature part and of the timestamp part. Left out, the whole header is one
   * signature.
   */
  readonly parts?: {
    readonly separator: string;
    readonly assign: string;
    readonly signature: string;
    readonly timestamp?: string;
  };

  /** A header of its own that carries the timestamp in Unix seconds, when the signature header does not. */
  readonly timestampHeader?: string;

  /** The header that carries the message id, for an `{id}` in `payload`. */
  readonly idHeader?: string;

  /** The HMAC hash. */
  readonly algorithm: "SHA-1" | "SHA-256" | "SHA-512";

  /** How the signature is written. */
  readonly encoding: "hex" | "base64";

  /** How the secret becomes the key: its UTF-8 bytes (`utf8`, the default) or its Base64 decoding (`base64`). */
  readonly secretEncoding?: "utf8" | "base64";

  /** A prefix the secret carries before its Base64 text (`whsec_`), dropped before decoding. */
  readonly secretPrefix?: string;

  /** The signed text: `{body}` is the raw body, `{timestamp}` and `{id}` the values above (`"{timestamp}.{body}"`). */
  readonly payload: string;

  /** How far the timestamp may be from the receiver's clock, either way; left out, the age is not checked. */
  readonly tolerance?: Interval;
}
