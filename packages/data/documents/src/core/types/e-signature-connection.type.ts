/**
 * Stackra file contract:
 * Purpose: `ESignatureConnection`, what an e-signature provider's Connection answers: the `ESignatureProvider` calls
 *          without the port's key, so a Connection (which already extends `Connection`) can serve them.
 * Boundary: a type only; `ConnectionESignatureDriver` routes the port to a Connection of this shape, chosen per call by
 *           ADR 0356. Envelope ids it answers are the provider's own.
 * Runtime: isomorphic
 * Governing contract: ADR 0365 (decision 5); ADR 0356 (decision 2).
 */
import type { ESignatureProvider } from "#contracts/ports/e-signature-provider.port";

/** The e-signature calls of a provider Connection. */
export type ESignatureConnection = Pick<
  ESignatureProvider,
  "send" | "status" | "download" | "cancel"
>;
