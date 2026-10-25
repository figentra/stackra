/**
 * Stackra file contract:
 * Purpose: `SignatureStatus`, the normalised state of an e-signature envelope, whatever the provider calls it.
 * Boundary: an enum (`Enum.of`). A driver maps its provider's states onto these; `signed`, `declined`, `expired` and
 *           `cancelled` are final, so nothing moves an envelope out of them.
 * Runtime: isomorphic
 * Governing contract: ADR 0365 (decision 5); ADR 0294 (decision 16: Enum).
 */
import { Enum } from "@stackra/contracts";

/**
 * Where an envelope is.
 *
 * @example
 * if (envelope.status === SignatureStatus.Signed) await files.store(await provider.download(envelope.id));
 */
export const SignatureStatus = Enum.of({
  /** Sent to the signers; nobody has opened it yet. */
  Sent: "sent",
  /** A signer opened it. */
  Viewed: "viewed",
  /** Every signer signed; the signed PDF can be downloaded. */
  Signed: "signed",
  /** A signer refused. */
  Declined: "declined",
  /** The provider's deadline passed before every signer signed. */
  Expired: "expired",
  /** The sender withdrew it. */
  Cancelled: "cancelled",
});

/** One of the codes above. */
export type SignatureStatus = Enum.Value<typeof SignatureStatus>;
