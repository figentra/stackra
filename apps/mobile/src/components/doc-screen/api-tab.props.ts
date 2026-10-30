/**
 * Stackra file contract:
 * Purpose: `ApiTabProps`: props of `ApiTab`.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rule 12).
 */
import type { ApiDoc } from "@stackra/showcase";

/** Props of {@link ApiTab}. */
export interface ApiTabProps {
  /** The entry's generated native ApiDoc, or undefined while the generator has not run for it. */
  readonly api: ApiDoc | undefined;
}
