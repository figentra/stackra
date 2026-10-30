/**
 * Stackra file contract:
 * Purpose: the native `Drawer.Description`: a short muted line under the title, inside `Drawer.Header`.
 * Boundary: text only.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); owner request 2026-10-29 (STA-1371).
 */
import type { ReactElement } from "react";

import type { DrawerPartContractProps } from "#contracts/types/drawer-part-contract-props.type";
import { Text } from "#native/text/text";

/** A line that says what the drawer is for. */
export function DrawerDescription({ children }: DrawerPartContractProps): ReactElement {
  return (
    <Text type="small" className="text-muted">
      {children}
    </Text>
  );
}
