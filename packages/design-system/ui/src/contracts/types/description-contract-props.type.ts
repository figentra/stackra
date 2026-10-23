/**
 * Stackra file contract:
 * Purpose: the props every runtime's `Description` takes: the help text under a field. Each runtime's
 *          `DescriptionProps` is this plus its HeroUI description's own props, which pass through unchanged.
 * Boundary: types only. Inside a HeroUI field the description is tied to the field for assistive technology; beside a
 *          plain control the caller ties it with `id` on the web and `nativeID` on native.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0055 (forms); ADR 0165.
 */
import type { ReactNode } from "react";

/** Props shared by the web and native `Description`. */
export interface DescriptionContractProps {
  /** The help text. */
  readonly children?: ReactNode;
}
