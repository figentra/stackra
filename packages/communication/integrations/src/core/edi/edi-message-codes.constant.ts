/**
 * Stackra file contract:
 * Purpose: `EDI_MESSAGE_CODES`, each canonical `EdiDocumentType` as the standards name it: the X12 transaction set and
 *          functional group, the EDIFACT message, and the element that carries our reference in each.
 * Boundary: standards data (X12 004010 and EDIFACT D.96A code lists), not business values: a trading partner's mapping
 *           is per-Connection data. A new document type is a new `EdiDocumentType` member and a row here.
 * Runtime: isomorphic
 * Governing contract: ADR 0447 (decision 4); stackra-46 re-scope (R2-7, M6); R3-SO-07 (the canonical set).
 */
import { EdiDocumentType } from "#contracts/enums/edi-document-type.enum";

/** How one document type is named in each syntax. */
interface EdiMessageCode {
  /** The X12 transaction set (ST01). */
  readonly x12: string;
  /** The X12 functional identifier code (GS01). */
  readonly group: string;
  /** The EDIFACT message type (UNH S009 0065). */
  readonly edifact: string;
  /** The X12 segment and element position of our reference. */
  readonly x12Reference: readonly [tag: string, position: number];
  /** The EDIFACT segment and element position of our reference (its first component). */
  readonly edifactReference: readonly [tag: string, position: number];
}

/**
 * The canonical documents in X12 and EDIFACT.
 *
 * @example
 * EDI_MESSAGE_CODES[EdiDocumentType.Order].x12; // "850"
 */
export const EDI_MESSAGE_CODES: Readonly<Record<EdiDocumentType, EdiMessageCode>> = {
  [EdiDocumentType.Order]: {
    x12: "850",
    group: "PO",
    edifact: "ORDERS",
    x12Reference: ["BEG", 3],
    edifactReference: ["BGM", 2],
  },
  [EdiDocumentType.OrderResponse]: {
    x12: "855",
    group: "PR",
    edifact: "ORDRSP",
    x12Reference: ["BAK", 3],
    edifactReference: ["BGM", 2],
  },
  [EdiDocumentType.DespatchAdvice]: {
    x12: "856",
    group: "SH",
    edifact: "DESADV",
    x12Reference: ["BSN", 2],
    edifactReference: ["BGM", 2],
  },
  [EdiDocumentType.Invoice]: {
    x12: "810",
    group: "IN",
    edifact: "INVOIC",
    x12Reference: ["BIG", 2],
    edifactReference: ["BGM", 2],
  },
  [EdiDocumentType.Acknowledgement]: {
    x12: "997",
    group: "FA",
    edifact: "CONTRL",
    x12Reference: ["AK1", 2],
    edifactReference: ["UCI", 1],
  },
};
