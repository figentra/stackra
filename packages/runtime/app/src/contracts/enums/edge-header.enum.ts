/**
 * Stackra file contract:
 * Purpose: `EdgeHeader`, the names of the headers the edge Worker forwards on `/api/*`: who the request is for (tenant,
 *          product, surface, realm), the request id and timestamp the signature covers, and the HMAC itself. The API
 *          pipeline trusts the first four only with a valid, fresh signature; without one only public endpoints answer.
 * Boundary: an `Enum.of` value plus the type of the same name; header names, lower case. The check (two keys during
 *           rotation, nonce and age refusal, the server-check order) is stackra-65's guard in this package. The
 *           timestamp, request-id and signature names are this contract's proposal until ADR 0437 lands.
 * Runtime: isomorphic
 * Governing contract: ADR 0437 (not yet landed: signed and replay-proof edge headers; app-shells 5.1 point 4, 16 point 2); ADR 0294
 *                     (decision 16).
 */
import { Enum } from "@stackra/contracts";

/** The signed edge headers. */
export const EdgeHeader = Enum.of({
  /** The tenant id; absent on a platform host. */
  Scope: "x-figentra-tenant",
  /** The product key. */
  Product: "x-figentra-product",
  /** The surface (`console`, `landing`, `till`). */
  Surface: "x-figentra-surface",
  /** The identity realm of the host. */
  Realm: "x-figentra-realm",
  /** The request id the Worker assigned. */
  RequestId: "x-figentra-request-id",
  /** When the Worker signed, Unix seconds. */
  Timestamp: "x-figentra-timestamp",
  /** The HMAC-SHA256 over the `EdgeSignatureInput`, base64url. */
  Signature: "x-figentra-signature",
});

/** One of the header names above. */
export type EdgeHeader = Enum.Value<typeof EdgeHeader>;
