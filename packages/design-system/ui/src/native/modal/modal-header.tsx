/**
 * Stackra file contract:
 * Purpose: `ModalHeader`, the native header of a modal or a drawer: a column for the title and a short description
 *          under it; a `Modal.Close` or `Drawer.Close` among its children leaves the column and sits on the title's
 *          row at the reading end (the right in English, the left in Arabic), as one row with the title.
 * Boundary: the shared `ModalSection` with the header's gaps; exposed as `Modal.Header` and `Drawer.Header`.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3, adapted forms); ADR 0305 (rule 10); ADR 0312; ADR 0060 (RTL).
 */
import { Children, isValidElement, type ReactElement, type ReactNode } from "react";

import { DrawerClose } from "#native/drawer/drawer-close";
import { ModalClose } from "#native/modal/modal-close";
import type { ModalSectionProps } from "#native/modal/modal-section.props";
import { ModalSection } from "#native/modal/modal-section";

/** Whether `child` is a close part, which belongs at the end of the title's row. */
const isClose = (child: ReactNode): boolean =>
  isValidElement(child) && (child.type === ModalClose || child.type === DrawerClose);

/** The header: a column for the title and a short description, with a close part at the row's end. */
export function ModalHeader({ children, ...props }: ModalSectionProps): ReactElement {
  const parts = Children.toArray(children);
  const close = parts.filter(isClose);
  const rest = parts.filter((child) => !isClose(child));
  if (close.length === 0)
    return (
      <ModalSection base="gap-1 pb-3" {...props}>
        {children}
      </ModalSection>
    );
  // Yoga's row follows the provider's direction, so the close part lands on the end edge in both directions.
  return (
    <ModalSection base="flex-row items-center gap-3 pb-3" {...props}>
      <ModalSection base="flex-1 gap-1">{rest.length === 1 ? rest[0] : rest}</ModalSection>
      {close}
    </ModalSection>
  );
}
