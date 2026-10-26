/**
 * Stackra file contract:
 * Purpose: `ModalHeader`, the native header of a modal or a drawer: a column for the title and a short description
 *          under it.
 * Boundary: the shared `ModalSection` with the header's gaps; exposed as `Modal.Header` and `Drawer.Header`.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3, adapted forms); ADR 0305 (rule 10); ADR 0312.
 */
import type { ReactElement } from "react";

import type { ModalSectionProps } from "#native/modal/modal-section.props";
import { ModalSection } from "#native/modal/modal-section";

/** The header: a column for the title and a short description under it. */
export function ModalHeader(props: ModalSectionProps): ReactElement {
  return <ModalSection base="gap-1 pb-3" {...props} />;
}
