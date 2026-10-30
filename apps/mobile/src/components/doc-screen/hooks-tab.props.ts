/**
 * Stackra file contract:
 * Purpose: `HooksTabProps`: props of `HooksTab`.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rule 12).
 */
import type { ApiHook } from "@stackra/showcase";

/** Props of {@link HooksTab}. */
export interface HooksTabProps {
  /** The entry's native hooks, from `ApiDoc.hooks`. */
  readonly hooks: readonly ApiHook[];
  /** The entry key the Arabic overlay is keyed by. */
  readonly entryKey: string;
}
