/**
 * Stackra file contract:
 * Purpose: `FiscalAuthorityUnavailableError`, the refusal when an authority, ASP, access point or fiscal device did not
 *          take a submission (a server error, throttling, a refused credential).
 * Boundary: a refusal (`Unavailable`); code derived from the class name; the fields carry keys and numbers only, never
 *           a
 *           document's content or personal data.
 * Runtime: isomorphic
 * Governing contract: ADR 0364; ADR 0294 (decisions 16 and 20); ADR 0140 (envelope and kinds); ADR 0328 (`create`).
 */
import { ErrorKind, Refusal } from "@stackra/errors";
import { Int, Str } from "@stackra/validation";

/**
 * Retryable: the record stays sealed and the next `submitPending` tries again.
 *
 * @example
 * throw FiscalAuthorityUnavailableError.create({ driver: "zatca", status: 503 });
 */
export class FiscalAuthorityUnavailableError extends Refusal({
  kind: ErrorKind.Unavailable,
  retryable: true,
}) {
  /** The driver that submitted. */
  @Str()
  driver!: string;

  /** The HTTP status, or 0 when a device answered in a shape the driver does not know. */
  @Int()
  status!: number;
}
