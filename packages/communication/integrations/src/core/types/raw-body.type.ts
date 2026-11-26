/**
 * Stackra file contract:
 * Purpose: `RawBody`, a request body a managed client call sends exactly as given, with its own media type: a SOAP
 *          envelope (`text/xml`), a signed payload, any body that is neither JSON nor a form.
 * Boundary: a type only. The connector builds the content (escaping every value it writes); the client neither parses
 *           nor changes it.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rule 13); STA-2617.
 */

/**
 * A body sent verbatim.
 *
 * @example
 * const body = { content: envelope, contentType: "text/xml; charset=utf-8" };
 * const reply = await api.post<string>("/Service.asmx", undefined, { body, text: true });
 */
export interface RawBody {
  /** The body, sent byte for byte as its UTF-8 encoding. */
  readonly content: string;

  /** The `content-type` header it is sent with (`text/xml; charset=utf-8`). */
  readonly contentType: string;
}
