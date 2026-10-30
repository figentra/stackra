/**
 * Stackra file contract:
 * Purpose: the native `Drawer.SubHeader`: a band under the header, ruled off from the body, for a SegmentedControl,
 *          Tabs, a step rail or a Stepper; outside the body, so it stays put while the body scrolls.
 * Boundary: layout only; the control inside is the caller's.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); owner request 2026-10-29 (STA-1371).
 */
import type { ReactElement } from "react";

import type { ModalSectionProps } from "#native/modal/modal-section.props";
import { ModalSection } from "#native/modal/modal-section";

/** The band under the header. */
export function DrawerSubHeader(props: ModalSectionProps): ReactElement {
  return <ModalSection base="border-b border-separator pb-3" {...props} />;
}
