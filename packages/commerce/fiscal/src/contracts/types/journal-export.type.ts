/**
 * Stackra file contract:
 * Purpose: `JournalExport`, a fiscal journal exported for an auditor: file name, media type, encoding and content.
 * Boundary: a type only; each driver writes its mandate's export format (a device archive, a signed-receipt file, JSON
 *           lines of the chain).
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decision 7).
 */

/** One export file. */
export type JournalExport = {
  /** Suggested file name. */
  readonly fileName: string;
  /** Media type. */
  readonly contentType: string;
  /** `utf-8` for text content, `base64` for binary content carried as text. */
  readonly encoding: "utf-8" | "base64";
  /** The file content. */
  readonly content: string;
};
