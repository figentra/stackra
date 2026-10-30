/**
 * Stackra file contract:
 * Purpose: `MarkdownInput`, what `toMarkdown` is made of: the translated words, the import line, the examples with
 *          their code and the ApiDoc parts.
 * Boundary: a type only, in its own file.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); showcase redesign spec (2026-10-27) section 4.
 */
import type { ApiPart, ApiSlot } from "@stackra/showcase";

/** What the markdown is made of. */
export interface MarkdownInput {
  readonly title: string;
  readonly description: string;
  readonly importLine: string;
  /** The compound code block, when the entry has parts. */
  readonly anatomy?: string | undefined;
  /** The examples in page order, `[0]` is Usage; `code` is undefined while a demo is missing. */
  readonly examples: readonly { readonly title: string; readonly code?: string | undefined }[];
  readonly parts: readonly ApiPart[];
  readonly slots?: readonly ApiSlot[] | undefined;
  /** The translated headings and column labels. */
  readonly words: {
    readonly import: string;
    readonly usage: string;
    readonly anatomy: string;
    readonly styling: string;
    readonly api: string;
    readonly propsOf: (part: string) => string;
    readonly renderProps: string;
    readonly prop: string;
    readonly type: string;
    readonly default: string;
    readonly description: string;
  };
}
