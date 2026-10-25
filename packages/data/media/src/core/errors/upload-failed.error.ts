/**
 * Stackra file contract:
 * Purpose: `UploadFailedError`, what the `http` uploader raises on the client when the service refuses to sign an
 *          upload or the store refuses the bytes.
 * Boundary: kind `Unavailable`, code `upload_failed`. The details are the HTTP status and, when the service answered
 *           with an error envelope, its refusal code (`upload_rejected`, `not_found`) as `serviceCode`, because `code`
 *           is the refusal's own; a status of 0 is a network failure. Never the file or the signed URL.
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (envelope and kinds); ADR 0294 (decisions 16 and 20); ADR 0222 (decision 2).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/** Retryable by its kind: a network or store failure may pass; a `serviceCode` from the service will not. */
export class UploadFailedError extends Refusal({ kind: ErrorKind.Unavailable }) {
  /** The HTTP status; 0 when no response arrived. */
  status!: number;

  /** The service's refusal code, or `null` when the answer carried none. */
  serviceCode!: string | null;
}
