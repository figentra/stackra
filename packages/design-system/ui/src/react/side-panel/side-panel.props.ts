/**
 * Stackra file contract:
 * Purpose: `SidePanelProps`, the props of the web `SidePanel` in `side-panel.tsx`: the shared contract (state, label)
 *          plus the width, the storage key, the small-screen breakpoint and the focus hand-off.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12); owner request 2026-10-29 (STA-1371, side panel).
 */
import type { ComponentPropsWithRef } from "react";

import type { LayoutBreakpoint } from "#contracts/enums/layout-breakpoint.enum";
import type { SidePanelVariant } from "#contracts/enums/side-panel-variant.enum";
import type { SidePanelContractProps } from "#contracts/types/side-panel-contract-props.type";

/** Props of the web SidePanel: the shared contract plus the layout row's `div` props, passed through. */
export type SidePanelProps = SidePanelContractProps &
  Omit<ComponentPropsWithRef<"div">, keyof SidePanelContractProps> & {
    /** The open panel's width in pixels, for a controlled width; pair it with `onWidthChange`. */
    readonly width?: number | undefined;
    /**
     * The look: `attached` (the default), a column joined to the page by a border; `split`, the page and the panel
     * as two rounded cards on the app's background with a gap around and between them.
     */
    readonly variant?: SidePanelVariant | undefined;
    /** The open panel's starting width in pixels. Defaults to 432 (27 rem). */
    readonly defaultWidth?: number | undefined;
    /** The narrowest width a resize reaches, in pixels. Defaults to 320 (20 rem). */
    readonly minWidth?: number | undefined;
    /** The widest width a resize reaches, in pixels. Defaults to half the window's width. */
    readonly maxWidth?: number | undefined;
    /** Called with the new width in pixels after each resize. */
    readonly onWidthChange?: ((width: number) => void) | undefined;
    /** A key under which the state and the width are kept in local storage, so they survive a reload. */
    readonly storageKey?: string | undefined;
    /**
     * Below this breakpoint there is no room to push the page, so opening draws the panel in the house Drawer over it;
     * false keeps it in the page at every width. Defaults to `md`.
     */
    readonly drawerBelow?: LayoutBreakpoint | false | undefined;
    /**
     * True, the default, to move focus into the panel when it opens: to the element inside marked `data-autofocus`,
     * else the panel itself. False leaves focus where it is.
     */
    readonly isFocusOnOpen?: boolean | undefined;
  };
