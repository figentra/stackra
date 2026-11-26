/**
 * Stackra file contract:
 * Purpose: `CredentialDataClass`, the built-in `credential` class for provider secrets (OAuth access and refresh
 *          tokens, client secrets, API keys, PKCE verifiers, webhook signing secrets): no agent ever sees it, support
 *          never does, search shows no snippet, no export carries it, it always rests sealed, a subject's erasure
 *          leaves it to go with its owning record, and a masked copy writes null.
 * Boundary: a declared data class made from the `credential` row of @stackra/contracts' `DATA_CLASSIFICATION_EFFECTS`,
 *           so `@Classify(CredentialDataClass)` and `@Classified(DataClassification.Credential)` mean the same and the
 *           row is stated once; its floor is code, never a tenant setting. Gen refuses a credential field that
 *           `HasEncryptedFields` does not name (`credential_field_not_encrypted`).
 * Runtime: isomorphic
 * Governing contract: ADR 0494 (the credential class); ADR 0341 (decision 3, the built-in class shape); ADR 0540
 *                     (decision 2: one table).
 */
import { DATA_CLASSIFICATION_EFFECTS, DataClassification } from "@stackra/contracts";

import { DataClass } from "#core/bases/data-class.base";
import type { DataClassOptions } from "#core/types/data-class-options.type";

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
  key: DataClassification.Credential,
  ...(DATA_CLASSIFICATION_EFFECTS.credential as Omit<DataClassOptions, "key">),
}) {}
