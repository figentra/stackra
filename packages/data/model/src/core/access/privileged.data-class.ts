/**
 * Stackra file contract:
 * Purpose: `PrivilegedDataClass`, the built-in `privileged` class for protected professional material (attorney-client
 *          communications, clinical notes): no agent sees it unless the tenant allows it, support never does, search
 *          shows no snippet outside the record's team, and every export labels it.
 * Boundary: a declared data class with the effects ADR 0341 decision 3 fixes; a product that needs a finer class
 *           declares its own. Its effects are the floor of the class, never a tenant setting.
 * Runtime: isomorphic
 * Governing contract: ADR 0341 (decision 3).
 */
import { DataClass } from "#core/bases/data-class.base";
import { AiAudience } from "#core/enums/ai-audience.enum";
import { ExportLabel } from "#core/enums/export-label.enum";
import { SearchSnippet } from "#core/enums/search-snippet.enum";
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
}) {}
