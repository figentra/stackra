/**
 * Stackra file contract:
 * Purpose: `ModalFooter`, the native footer of a modal or a drawer: a row for actions, at the reading end of the line
 *          in both directions.
 * Boundary: the shared `ModalSection` with the footer's gaps; exposed as `Modal.Footer` and `Drawer.Footer`.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3, adapted forms); ADR 0305 (rule 10); ADR 0312.
 */
import type { ReactElement } from "react";

import type { ModalSectionProps } from "#native/modal/modal-section.props";
import { ModalSection } from "#native/modal/modal-section";

/** The footer: a row for actions, at the reading end of the line in both directions. */
export function ModalFooter(props: ModalSectionProps): ReactElement {
  return <ModalSection base="flex-row items-center justify-end gap-2 pt-4" {...props} />;
}
