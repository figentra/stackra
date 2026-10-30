/**
 * Stackra file contract:
 * Purpose: `CredentialDataClass`, the built-in `credential` class for provider secrets (OAuth access and refresh
 *          tokens, client secrets, API keys, PKCE verifiers, webhook signing secrets): no agent ever sees it, support
 *          never does, search shows no snippet, and no export carries it.
 * Boundary: a declared data class with the strictest effect on every axis, which is its floor and never a tenant
 *           setting. A field that holds a credential also carries `@Classified(DataClassification.Credential)` and is
 *           named by `HasEncryptedFields` (gen's `credential_field_not_encrypted`); the classification is what the
 *           panel export, subject access, erasure, the access log and column visibility read.
 * Runtime: isomorphic
 * Governing contract: ADR 0494 (the credential class); ADR 0341 (decision 3, the built-in class shape).
 */
import { DataClass } from "#core/bases/data-class.base";
import { AiAudience } from "#core/enums/ai-audience.enum";
import { ExportLabel } from "#core/enums/export-label.enum";
import { SearchSnippet } from "#core/enums/search-snippet.enum";
import { SupportAccess } from "#core/enums/support-access.enum";

/**
 * The credential class.
 *
 * @example
 * ```ts
 * @Classify(CredentialDataClass)
 * @Classified(DataClassification.Credential)
 * accessToken!: string;
 * ```
 */
export class CredentialDataClass extends DataClass({
  key: "credential",
  ai: AiAudience.Never,
  support: SupportAccess.Hidden,
  search: SearchSnippet.NoSnippet,
  export: ExportLabel.Excluded,
}) {}
