/**
 * Stackra file contract:
 * Purpose: `DATA_CLASSIFICATION_EFFECTS`, the eight effects of each built-in `DataClassification`: the one table that
 *          says how a `personal`, `financial`, `health`, `pseudonymous`, `regulated` or `credential` field is read,
 *          encrypted, erased, retained and masked. `@Classified(DataClassification.X)` means exactly this row.
 * Boundary: a frozen constant. @stackra/model's `builtInDataClass` and `fieldDataClasses` read it at runtime, its
 *           `CredentialDataClass` states the `credential` row and a test holds them equal, and gen reads it to check a
 *           model at build time. A product tightens a class by declaring its own `DataClass`; nothing loosens a row.
 * Runtime: isomorphic
 * Governing contract: ADR 0540 (decision 2: the table); ADR 0380 (decision 2, the access effects of the classes);
 *                     ADR 0494 (`credential`: never exported, always encrypted, never erased with a subject).
 */
import { DataClassification } from "#core/enums/data-classification.enum";
import type { DataClassEffects } from "#core/types/data-class-effects.type";

/** The effects of every built-in classification, keyed by its code. */
export const DATA_CLASSIFICATION_EFFECTS: Readonly<
  Record<DataClassification, Readonly<DataClassEffects>>
> = Object.freeze({
  [DataClassification.Personal]: Object.freeze({
    ai: "allowed",
    support: "visible",
    search: "snippet",
    export: "labelled",
    encrypt: "clear",
    erasure: "anonymise",
    retention: "none",
    mask: "fake",
  }),
  [DataClassification.Financial]: Object.freeze({
    ai: "allowed",
    support: "visible",
    search: "snippet",
    export: "labelled",
    encrypt: "clear",
    erasure: "anonymise",
    retention: "none",
    mask: "fake",
  }),
  [DataClassification.Health]: Object.freeze({
    ai: "tenant_opt_in",
    support: "hidden",
    search: "no_snippet",
    export: "labelled",
    encrypt: "sealed",
    erasure: "anonymise",
    retention: "required",
    mask: "null",
  }),
  [DataClassification.Pseudonymous]: Object.freeze({
    ai: "allowed",
    support: "visible",
    search: "snippet",
    export: "labelled",
    encrypt: "clear",
    erasure: "anonymise",
    retention: "none",
    mask: "hash",
  }),
  [DataClassification.Regulated]: Object.freeze({
    ai: "tenant_opt_in",
    support: "hidden",
    search: "no_snippet",
    export: "labelled",
    encrypt: "clear",
    erasure: "anonymise",
    retention: "none",
    mask: "fake",
  }),
  [DataClassification.Credential]: Object.freeze({
    ai: "never",
    support: "hidden",
    search: "no_snippet",
    export: "excluded",
    encrypt: "sealed",
    erasure: "keep",
    retention: "none",
    mask: "null",
  }),
});
