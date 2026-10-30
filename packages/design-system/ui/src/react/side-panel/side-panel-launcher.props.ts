/**
 * Stackra file contract:
 * Purpose: `SidePanelLauncherProps`, the props of `SidePanel.Launcher` in `side-panel-launcher.tsx`.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12); owner request 2026-10-29 (STA-1371, side panel).
 */
import type { ComponentPropsWithRef, ReactNode } from "react";

import type { IconSlot } from "#contracts/types/icon-slot.type";

/** Props of SidePanel.Launcher: a `div`'s props plus its title, input slot and actions. */
export type SidePanelLauncherProps = Omit<ComponentPropsWithRef<"div">, "children" | "title"> & {
  /** The words of the button that opens the panel, for example "Ask the assistant". */
  readonly title: string;
  /** An icon before the title. */
  readonly icon?: IconSlot | undefined;
  /** An optional slot after the title, for an input; open the panel from it with `useSidePanel`. */
  readonly children?: ReactNode;
  /** Buttons at the end of the bar. */
  readonly actions?: ReactNode;
};
