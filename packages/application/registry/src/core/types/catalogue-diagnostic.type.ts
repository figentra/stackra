/**
 * Stackra file contract:
 * Purpose: `CatalogueDiagnostic`, one problem `validateCatalogue` found: its code, the member and the path inside that
 *          member's manifest, and a message for a person.
 * Boundary: a type only; plain data, so it serialises as it is into a CI log or a refusal's details.
 * Runtime: isomorphic
 * Governing contract: ADR 0109 (CI rejects a manifest); ADR 0231 (snake_case codes, camelCase JSON keys).
 */
import type { CatalogueDiagnosticCode } from "#core/enums/catalogue-diagnostic-code.enum";

/** One problem in a catalogue. */
export type CatalogueDiagnostic = {
  /** What is wrong. */
  readonly code: CatalogueDiagnosticCode;
  /** The `member` of the manifest at fault, as written; `""` when that field is not a string. */
  readonly member: string;
  /** Where in that manifest, as `modules[0].dependsOn[1]`; `""` for the manifest itself. */
  readonly path: string;
  /** What is wrong, in English, naming the identities involved. */
  readonly message: string;
};
