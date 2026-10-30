/**
 * Stackra file contract:
 * Purpose: `HoverCardContractProps`, the props of every runtime's `HoverCard`: a preview card (a person, a link, an
 *          order) that opens while the trigger is hovered or focused on web, and on press on native, where nothing hovers.
 * Boundary: types only. The card adds to the trigger; the trigger still works on its own (a link still goes).
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); WCAG 2.2 SC 1.4.13 (content on hover or focus); STA-1371.
 */
import type { ReactElement, ReactNode } from "react";

import type { PlacementContractProps } from "#contracts/types/placement-contract-props.type";

/** Props shared by the web and native `HoverCard`. */
export interface HoverCardContractProps extends PlacementContractProps {
  /** The element previewed, usually a link or a name. */
  readonly trigger: ReactElement;
  /** The card's content. */
  readonly children: ReactNode;
  /** The card's accessible name, such as "Profile preview". */
  readonly label: string;
  /** Milliseconds of hover before the card opens (web); 500 by default. */
  readonly openDelay?: number | undefined;
  /** Milliseconds after the pointer leaves before it closes (web); 200 by default. */
  readonly closeDelay?: number | undefined;
}
