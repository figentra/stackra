/**
 * Stackra file contract:
 * Purpose: the `ESignatureProvider` port: sends a PDF to an e-signature provider, follows its envelope, downloads the
 *          signed PDF and cancels an open envelope.
 * Boundary: an abstract class that is its own token, keyed `documents.ESignatureProvider`. The provider for a call is
 *           chosen by the tenant's Connection, else the Market's platform default (ADR 0356); which providers a market
 *           offers is market-pack data and the price is a rate card, never code. Drivers are integrations connectors;
 *           this package ships only the `memory` driver. `send` is idempotent on `reference`. `download` before
 *           `signed` throws `SignatureNotCompleteError`; an unknown id throws `SignatureEnvelopeNotFoundError`;
 *           cancelling a closed envelope throws `SignatureEnvelopeClosedError` (all from `.`).
 * Runtime: isomorphic
 * Governing contract: ADR 0365 (decisions 4 and 5); ADR 0356; ADR 0294 (decisions 15 and 16).
 */
import { Port } from "@stackra/contracts";

import type { SignatureEnvelope } from "#contracts/types/signature-envelope.type";
import type { SignatureRequest } from "#contracts/types/signature-request.type";

/**
 * An e-signature provider.
 *
 * @example
 * const envelope = await provider.send({ reference: form.id, title, document: pdf, contentHash, signers, locale });
 */
export abstract class ESignatureProvider extends Port {
  /** Type-only port key, so `DriverName<ESignatureProvider>` narrows to this port's drivers. */
  declare readonly "~key": "documents.ESignatureProvider";

  /** Opens an envelope for `request`, or answers the one already opened for its `reference`. */
  abstract send(request: SignatureRequest): Promise<SignatureEnvelope>;

  /**
   * The envelope as the provider sees it now.
   *
   * @throws SignatureEnvelopeNotFoundError when the provider has no such envelope.
   */
  abstract status(envelopeId: string): Promise<SignatureEnvelope>;

  /**
   * The signed PDF, with the provider's seal.
   *
   * @throws SignatureNotCompleteError while the envelope is not `signed`.
   */
  abstract download(envelopeId: string): Promise<Uint8Array>;

  /**
   * Withdraws an open envelope and answers it, now `cancelled`.
   *
   * @throws SignatureEnvelopeClosedError when it is already in a final status.
   */
  abstract cancel(envelopeId: string): Promise<SignatureEnvelope>;
}
