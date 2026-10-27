/**
 * Stackra file contract:
 * Purpose: `DesignSystemComponent`: one component of the review area: its page link and the screen that shows it.
 * Boundary: a type only, in its own file.
 * Runtime: react-native
 * Governing contract: ADR 0320 (glass and the showcase stage); ADR 0305 (rule 10).
 */
import type { ReactElement } from "react";
import type { PageLink } from "./page-link.type";

/** One component of the review area: its page link and the screen that shows it. */
export interface DesignSystemComponent extends PageLink {
  /** The page that shows the component. */
  readonly screen: () => ReactElement;
}
