/**
 * Stackra file contract:
 * Purpose: `EdiConnector`, what an EDI network's Connection implements (managed: Figentra's ecosio, TrueCommerce or SPS
 *          Commerce account, named per pack; bring your own: the chain's provider on the same contract): send a
 *          document once per idempotency key, receive the documents the network holds for us, and acknowledge each.
 * Boundary: an interface a Connection implements when its Integration declares `ConnectorKind.Edi` under
 *           `IntegrationCategory.Edi`. No codec and no AS2 here: the network takes canonical JSON (R3-SO-07). The
 *           managed network driver is batch stackra-46; the vendor connectors are OS integrations (stackra-45).
 * Runtime: isomorphic
 * Governing contract: ADR 0447 (decision 4); ADR 0355 (decision 1); ADR 0356 (decision 2); R3-SO-03; R3-SO-07;
 *                     STA-795.
 */
import type { EdiDocument } from "#contracts/types/edi-document.type";
import type { EdiDocumentPage } from "#contracts/types/edi-document-page.type";

/**
 * An EDI network account.
 *
 * @example
 * export class EcosioConnection extends Connection<EcosioIntegration> implements EdiConnector { … }
 */
export interface EdiConnector {
  /**
   * Sends `document` under `idempotencyKey`; a repeated key returns the first answer and sends nothing.
   *
   * @returns the network's id of the document.
   * @throws ProviderRefusedError when the network refuses it (an unknown partner, a body that fails its checks).
   */
  send: (document: EdiDocument, idempotencyKey: string) => Promise<{ readonly id: string }>;

  /** The documents received since `since` and not yet acknowledged, a page at a time. */
  receive: (since: Date, cursor?: string) => Promise<EdiDocumentPage>;

  /** Tells the network we took document `id`, so it is not delivered again. */
  acknowledge: (id: string) => Promise<void>;
}
