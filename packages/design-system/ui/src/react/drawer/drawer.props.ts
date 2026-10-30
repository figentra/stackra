/**
 * Stackra file contract:
 * Purpose: `DrawerProps`, the props of the web `Drawer` in `drawer.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0303 (decision
 *          7); ADR 0312 (decisions 1 and 2); ADR 0165 (HeroUI v3 on web); ADR 0060 (right-to-left); WCAG 2.2 SC 2.1.2,
 *          2.4.3 and 4.1.2.
 */
import type { DrawerDialogProps as HeroDrawerDialogProps } from "@heroui/react";
import type { DrawerContractProps } from "#contracts/types/drawer-contract-props.type";

/**
 * Props of the web Drawer: the shared contract plus HeroUI v3's own dialog props, passed through to the dialog.
 * HeroUI's `aria-label` is the contract's `label`, and its `left` and `right` edges are the contract's `start` and
 * `end`.
 */
export type DrawerProps = DrawerContractProps &
  Omit<HeroDrawerDialogProps, keyof DrawerContractProps | "aria-label"> & {
    /**
     * True to let a side drawer's inner edge be dragged (or arrow-keyed) to set its width, from 320 px to the screen
     * less the insets. Defaults to false. Ignored on the top and bottom edges.
     */
    readonly isResizable?: boolean | undefined;
    /**
     * True to draw an expand button in `Drawer.Header` that moves a side drawer between its width and the full screen.
     * Defaults to false. Ignored on the top and bottom edges.
     */
    readonly isExpandable?: boolean | undefined;
  };
