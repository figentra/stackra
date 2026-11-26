/**
 * Stackra file contract:
 * Purpose: `PrivilegedDataClass`, the built-in `privileged` class for protected professional material (attorney-client
 *          communications, clinical notes): no agent sees it unless the tenant allows it, support never does, search
 *          shows no snippet outside the record's team, every export labels it, and a masked copy never carries it.
 * Boundary: a declared data class with the access effects ADR 0341 decision 3 fixes. It is not personal data by itself
 *           (erasure keeps it; a product whose privileged field is a subject's names it in `PersonalData`) and it sets
 *           no encryption or retention floor: a product that needs those declares a finer class. Its effects are the
 *           floor of the class, never a tenant setting.
 * Runtime: isomorphic
 * Governing contract: ADR 0341 (decision 3); ADR 0540 (decision 1: its keeping effects).
 */
import { DataClass } from "#core/bases/data-class.base";
import { AiAudience } from "#core/enums/ai-audience.enum";
import { ExportLabel } from "#core/enums/export-label.enum";
import { FieldEncryption } from "#core/enums/field-encryption.enum";
import { MaskMethod } from "#core/enums/mask-method.enum";
import { RetentionBound } from "#core/enums/retention-bound.enum";
import { SearchSnippet } from "#core/enums/search-snippet.enum";
import { SubjectErasure } from "#core/enums/subject-erasure.enum";
import { SupportAccess } from "#core/enums/support-access.enum";

/**
 * The privileged class.
 *
 * @example
 * ```ts
 * @Classify(PrivilegedDataClass)
 * body!: string;
 * ```
 */
export class PrivilegedDataClass extends DataClass({
  key: "privileged",
  ai: AiAudience.ScopeOptIn,
  support: SupportAccess.Hidden,
  search: SearchSnippet.NoSnippet,
  export: ExportLabel.Labelled,
  encrypt: FieldEncryption.Clear,
  erasure: SubjectErasure.Keep,
  retention: RetentionBound.None,
  mask: MaskMethod.Null,
}) {}
