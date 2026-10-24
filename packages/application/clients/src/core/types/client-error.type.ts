/**
 * Stackra file contract:
 * Purpose: `ClientError`, what a generated-client call rejects with: a refusal decoded from the producer's envelope, or
 *          a `TransportError` when no answer could be read. `refusalKey` is the declared message key of a refusal ref.
 * Boundary: a type only. A call never rejects with a raw `Response`, a status code or a zod error; an invalid input is
 *           an `InputInvalidError` refusal with field errors.
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (envelope and kinds); ADR 0260 (decision 4).
 */
import type { Refusal } from "@stackra/errors";
import type { I18nKey } from "@stackra/i18n";

/** A refusal, with the translated message key when the refusal's ref declares one. */
export type ClientError = Refusal & {
  /** The refusal ref's message key (`inventory::errors.insufficient_stock.message`), when it declares one. */
  readonly refusalKey?: I18nKey;
};
