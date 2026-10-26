/**
 * Stackra file contract:
 * Purpose: `ModalBody`, the native body of a modal or a drawer: a column for the content.
 * Boundary: the shared `ModalSection` with the body's gaps; exposed as `Modal.Body` and `Drawer.Body`.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3, adapted forms); ADR 0305 (rule 10); ADR 0312.
 */
import type { ReactElement } from "react";

import type { ModalSectionProps } from "#native/modal/modal-section.props";
import { ModalSection } from "#native/modal/modal-section";

/** The body: a column for the content. */
export function ModalBody(props: ModalSectionProps): ReactElement {
  return <ModalSection base="gap-3 py-2" {...props} />;
}
