/**
 * Stackra file contract:
 * Purpose: `PageReading`, one page a `PageReader` read: the final URL after redirects, the status, the title and
 *          language, the readable text, whether the text was cut at the policy's limit, and the product hints.
 * Boundary: a type only. Everything in it comes from an untrusted page: a consumer that hands it to a model treats it as
 *           data, never as instructions (guardrails, ADR 0360), and stores none of it here.
 * Runtime: isomorphic
 * Governing contract: ADR 0450 (decisions 1 and 2); STA-904 (page reader).
 */
import type { ProductHint } from "#contracts/types/product-hint.type";

/** One page read. */
export interface PageReading {
  /** The URL the page was read from, after redirects. */
  readonly url: string;

  /** The HTTP status of the final response (200 from the memory driver). */
  readonly status: number;

  /** The document title. */
  readonly title?: string;

  /** The document language from `<html lang>`, e.g. `ar-SA`. */
  readonly lang?: string;

  /** The readable text: scripts, styles and markup removed, one block per line. */
  readonly text: string;

  /** True when `text` was cut at the policy's character limit. */
  readonly truncated: boolean;

  /** The products the page's schema.org markup describes, in page order. */
  readonly products: readonly ProductHint[];
}
