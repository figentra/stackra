/**
 * Stackra file contract:
 * Purpose: `DataClassEffects`, the eight effects a data class sets for its fields, as their snake_case codes: who may
 *          read them (`ai`, `support`, `search`, `export`) and how they are kept (`encrypt`, `erasure`, `retention`,
 *          `mask`).
 * Boundary: a type only, over plain codes, so a package that cannot import @stackra/model (gen, the logger) reads the
 *           same effects. @stackra/model's `DataClassOptions` states the same codes through its enums.
 * Runtime: isomorphic
 * Governing contract: ADR 0540 (one classification source); ADR 0341 (decision 2); ADR 0380 (decision 5, snake_case
 *                     codes); ADR 0494 (`excluded`).
 */

/** The effects of one data class. */
export interface DataClassEffects {
  /** Whether its fields may enter an agent's context. */
  readonly ai: "never" | "tenant_opt_in" | "allowed";

  /** Whether support access sees its fields. */
  readonly support: "hidden" | "visible";

  /** Whether search shows a snippet of its fields outside the record's team. */
  readonly search: "no_snippet" | "snippet";

  /** How an export writes its fields. */
  readonly export: "excluded" | "labelled";

  /**
   * How its fields rest: in clear, sealed by `HasEncryptedFields`, or sealed under the subject's own key
   * (`HasEncryptedFields({ subject })`), so destroying the subject's salt shreds them.
   */
  readonly encrypt: "clear" | "sealed" | "subject_sealed";

  /**
   * What erasing a subject does to its fields: `keep` (not the subject's personal data: erasure leaves it, and a
   * declaration may still name it), `anonymise` (overwritten with null), `delete` (the row goes) or `shred` (its subject
   * key's salt is destroyed).
   */
  readonly erasure: "keep" | "anonymise" | "delete" | "shred";

  /** Whether a model holding a field of the class must declare `Retention` (`required`) or may keep rows open-ended. */
  readonly retention: "none" | "required";

  /**
   * What a masked copy (a staging copy, a seed pack) writes in place of its fields: the value (`keep`), a keyed hash
   * that keeps equal values equal (`hash`), a generated stand-in (`fake`) or null.
   */
  readonly mask: "keep" | "hash" | "fake" | "null";
}
