/**
 * Stackra file contract:
 * Purpose: `SkippedDocument`, a document an assistant has no form for (a hook for OpenCode, a command for Kiro), named
 *          with the reason, so nothing vanishes silently.
 * Boundary: type only; `renderAssistant` returns the list beside the files.
 * Runtime: isomorphic
 * Governing contract: ADR 0282 (decision 2).
 */
import type { AgentDocumentKind } from "@stackra/skills";

/** One document left out of an assistant's layout. */
export type SkippedDocument = {
  /** The document's kind. */
  readonly kind: AgentDocumentKind;
  /** The document's name. */
  readonly name: string;
  /** Why the assistant cannot take it. */
  readonly reason: string;
};
