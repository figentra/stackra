/**
 * Stackra file contract:
 * Purpose: `TermsPromptProps`, what the terms prompt takes: the documents to accept, the accept handler and whether
 *          it runs.
 * Boundary: a type only. Accepting is the host's call to the server (`ConsentProofService.answer` per document).
 * Runtime: isomorphic
 * Governing contract: owner round 3 #29; ADR 0294 (decision 8).
 */
import type { TermsDocumentLink } from "#ui/terms-prompt/terms-document-link.type";

/** Props of `TermsPrompt`. */
export interface TermsPromptProps {
  /** The documents not yet accepted in their current version. */
  readonly documents: readonly TermsDocumentLink[];

  /** Accepts every listed document. */
  readonly onAccept: () => void;

  /** The acceptance is being recorded. */
  readonly isLoading?: boolean;
}
