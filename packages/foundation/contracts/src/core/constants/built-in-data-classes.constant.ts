/**
 * Stackra file contract:
 * Purpose: `BUILT_IN_DATA_CLASSES`, the key and the eight effects of each data class @stackra/model ships
 *          (`CredentialDataClass`, `PrivilegedDataClass`), keyed by the class's exported name. Gen recognises a
 *          `@Classify(X)` argument as built-in by its package: the checker resolves `X` to its declaration, and when
 *          that declaration is a class of the `@stackra/model` package named here, gen reads its effects from this
 *          table instead of from the class's `DataClass({...})` call, which a published `.d.ts` does not carry.
 * Boundary: a frozen constant. The credential row is `DATA_CLASSIFICATION_EFFECTS.credential` itself; @stackra/model's
 *           tests hold each class's own `dataClass` equal to its row here, so the classes and gen never drift.
 * Runtime: isomorphic
 * Governing contract: ADR 0540 (decision 2: one table; decision 7: built-in classes recognised by package); ADR 0341
 *                     (decision 3, the privileged class); ADR 0494 (the credential class).
 */
import { DATA_CLASSIFICATION_EFFECTS } from "#core/constants/data-classification-effects.constant";
import { DataClassification } from "#core/enums/data-classification.enum";
import type { DataClassEffects } from "#core/types/data-class-effects.type";

/** Each built-in data class of @stackra/model, by its exported name: its key and its effects. */
export const BUILT_IN_DATA_CLASSES: Readonly<
  Record<
    "CredentialDataClass" | "PrivilegedDataClass",
    Readonly<{ readonly key: string } & DataClassEffects>
  >
> = Object.freeze({
  CredentialDataClass: Object.freeze({
    key: DataClassification.Credential,
    ...DATA_CLASSIFICATION_EFFECTS[DataClassification.Credential],
  }),
  PrivilegedDataClass: Object.freeze({
    key: "privileged",
    ai: "tenant_opt_in",
    support: "hidden",
    search: "no_snippet",
    export: "labelled",
    encrypt: "clear",
    erasure: "keep",
    retention: "none",
    mask: "null",
  }),
});
