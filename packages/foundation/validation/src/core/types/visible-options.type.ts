/**
 * Stackra file contract:
 * Purpose: `VisibleOptions`, the options of `@Visible({ audience })`: the audiences a field reaches.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0095 (decision 6); ADR 0294 (R6).
 */
import type { OutputAudience } from "#core/enums/output-audience.enum";

/** Which audiences see a field. */
export interface VisibleOptions {
  /** The audiences that read the field, at least one. */
  readonly audience: readonly OutputAudience[];
}
