/**
 * Stackra file contract:
 * Purpose: `EdiDocumentType`, the canonical EDI documents an `EdiConnector` carries: a purchase order, the supplier's
 *          order response, the despatch advice (ASN), the invoice and a functional acknowledgement.
 * Boundary: an `Enum.of` value plus the type of the same name. These are the canonical document set the EDI network
 *           maps to EDIFACT, X12 or GS1 XML (ORDERS or 850, ORDRSP or 855, DESADV or 856, INVOIC or 810, CONTRL or
 *           997); the codecs are the network's, never ours (R3-SO-07).
 * Runtime: isomorphic
 * Governing contract: ADR 0447 (decision 4); R3-SO-07; GRO-158a; ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/**
 * The EDI documents.
 *
 * @example
 * await edi.send({ type: EdiDocumentType.Order, partner: "gln:6291041500213", reference: "po_42", body }, "po_42");
 */
export const EdiDocumentType = Enum.of({
  /** A purchase order (EDIFACT ORDERS, X12 850). */
  Order: "order",
  /** The supplier's answer to an order (ORDRSP, 855). */
  OrderResponse: "order_response",
  /** The advance ship notice (DESADV, 856). */
  DespatchAdvice: "despatch_advice",
  /** The invoice (INVOIC, 810). */
  Invoice: "invoice",
  /** A functional acknowledgement of a received document (CONTRL, 997). */
  Acknowledgement: "acknowledgement",
});

/** One of the codes above. */
export type EdiDocumentType = Enum.Value<typeof EdiDocumentType>;
