/**
 * Stackra file contract:
 * Purpose: `DataClassOptions`, what `DataClass({ ... })` declares: the class's key and the eight effects its fields
 *          get: who may read them (`ai`, `support`, `search`, `export`) and how they are kept (`encrypt`, `erasure`,
 *          `retention`, `mask`).
 * Boundary: a type only. Every effect is required, so a declared class never leaves one to a default. Its codes are
 *           @stackra/contracts' `DataClassEffects`, which gen and the built-in classification table read.
 * Runtime: isomorphic
 * Governing contract: ADR 0341 (decisions 1 and 2); ADR 0540 (decision 1: the four keeping effects).
 */
import type { AiAudience } from "#core/enums/ai-audience.enum";
import type { ExportLabel } from "#core/enums/export-label.enum";
import type { FieldEncryption } from "#core/enums/field-encryption.enum";
import type { MaskMethod } from "#core/enums/mask-method.enum";
import type { RetentionBound } from "#core/enums/retention-bound.enum";
import type { SearchSnippet } from "#core/enums/search-snippet.enum";
import type { SubjectErasure } from "#core/enums/subject-erasure.enum";
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

  /** How its fields rest: in clear, sealed, or sealed under the subject's key. */
  readonly encrypt: FieldEncryption;

  /** What erasing a subject does to its fields; anything but `keep` makes them the subject's personal data. */
  readonly erasure: SubjectErasure;

  /** Whether a model holding one of its fields must declare `Retention`. */
  readonly retention: RetentionBound;

  /** What a masked copy writes in place of its fields. */
  readonly mask: MaskMethod;
}
