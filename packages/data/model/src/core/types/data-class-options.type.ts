/**
 * Stackra file contract:
 * Purpose: `DataClassOptions`, what `DataClass({ ... })` declares: the class's key and the four effects its fields get.
 * Boundary: a type only. Every effect is required, so a declared class never leaves one to a default.
 * Runtime: isomorphic
 * Governing contract: ADR 0341 (decisions 1 and 2).
 */
import type { AiAudience } from "#core/enums/ai-audience.enum";
import type { ExportLabel } from "#core/enums/export-label.enum";
import type { SearchSnippet } from "#core/enums/search-snippet.enum";
import type { SupportAccess } from "#core/enums/support-access.enum";

/** A data class's key and effects. */
export interface DataClassOptions {
  /** The class's machine code, snake_case (`privileged`, `clinical_note`). */
  readonly key: string;

  /** Whether its fields may enter an agent's context. */
  readonly ai: AiAudience;

  /** Whether support access sees its fields. */
  readonly support: SupportAccess;

  /** Whether search shows a snippet of its fields outside the record's team. */
  readonly search: SearchSnippet;

  /** How an export writes its fields. */
  readonly export: ExportLabel;
}
