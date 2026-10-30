/**
 * Stackra file contract:
 * Purpose: the props every runtime's `Drawer.Description` and `Drawer.SubHeader` take: the content of the part.
 * Boundary: types only. The description is a short line under the title; the sub-header is a band fixed under the
 *           header for a SegmentedControl, Tabs, a step rail or a Stepper, so it stays put while the body scrolls.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3).
 */
import type { ReactNode } from "react";

/** Props shared by the web and native drawer description and sub-header. */
export interface DrawerPartContractProps {
  /** The part's content. */
  readonly children: ReactNode;
}
