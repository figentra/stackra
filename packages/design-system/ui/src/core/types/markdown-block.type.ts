/**
 * Stackra file contract:
 * Purpose: `MarkdownBlock`, one block of a Markdown document (`markdownBlocksOf`).
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); STA-1371.
 */
/** One block of a Markdown document. */
export type MarkdownBlock =
  | { readonly kind: "heading"; readonly level: 1 | 2 | 3; readonly text: string }
  | { readonly kind: "paragraph"; readonly text: string }
  | { readonly kind: "quote"; readonly text: string }
  | { readonly kind: "list"; readonly isOrdered: boolean; readonly items: readonly string[] }
  | { readonly kind: "code"; readonly language: string; readonly code: string };
