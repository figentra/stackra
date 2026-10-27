/**
 * Stackra file contract:
 * Purpose: `MailAttachment`, one file a mail carries (an invoice, a ZATCA PDF, an inline logo): its file name, its
 *          content type, and either its bytes or a storage reference the sender reads, plus a content id when it is
 *          shown inline (`<img src="cid:…">`).
 * Boundary: a type only. Exactly one of `content` and `ref` is set; `ref` is the storage key the host's sender resolves
 *           (a media or object store key), so large files never travel in the delivery job's payload.
 * Runtime: isomorphic
 * Governing contract: ADR 0223 (notifications); stackra-218 (STA-1376); RFC 2392 (cid URLs).
 */

/** One attached file, by bytes or by storage reference. */
export type MailAttachment = {
  /** The file name the recipient sees (`invoice-2026-0042.pdf`). */
  readonly filename: string;

  /** The MIME type (`application/pdf`). */
  readonly contentType: string;

  /** The content id an inline part is referenced by (`logo`, shown as `cid:logo`); absent for a plain attachment. */
  readonly contentId?: string;
} & (
  | {
      /** The file's bytes. */
      readonly content: Uint8Array;
      readonly ref?: never;
    }
  | {
      /** The storage key the sender reads the file from. */
      readonly ref: string;
      readonly content?: never;
    }
);
