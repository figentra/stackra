/**
 * Stackra file contract:
 * Purpose: `EdiMessage`, one transaction set (X12 ST to SE) or message (EDIFACT UNH to UNT) inside an interchange: its
 *          code, control number and body segments.
 * Boundary: a type only. `segments` excludes the ST/SE and UNH/UNT trailers, which the writer adds and the reader
 *           checks; each segment is its tag followed by its elements.
 * Runtime: isomorphic
 * Governing contract: ADR 0447 (decision 4); stackra-46 re-scope (R2-7, M6).
 */
import type { EdiElement } from "#contracts/edi/edi-element.type";

/** A transaction set or message. */
export interface EdiMessage {
  /** The message code: `850`, `810`, `997` in X12; `ORDERS`, `INVOIC`, `CONTRL` in EDIFACT. */
  readonly code: string;

  /** Its control number (ST02, UNH 0062). */
  readonly control: string;

  /** The body segments, each `[tag, ...elements]`. */
  readonly segments: readonly (readonly EdiElement[])[];

  /** The X12 functional group it came in (GS01 and GS06); the 997 quotes it. Read only, the writer derives it. */
  readonly group?: { readonly code: string; readonly control: string };

  /** The EDIFACT message version after the code (`D:96A:UN`); left out, the interchange's. */
  readonly version?: string;
}
