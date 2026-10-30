/**
 * Stackra file contract:
 * Purpose: `SplitViewProps`, the props of the web `SplitView` in `split-view.tsx`: the shared contract, the web-only
 *          resize props (a window splitter between the panes on the shared pane engine) and the root's own props.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); STA-1371 (shared
 *          pane engine, owner approval 2026-10-29).
 */
import type { ComponentPropsWithoutRef } from "react";
import type { SplitViewContractProps } from "#contracts/types/split-view-contract-props.type";

/**
 * Props of the web SplitView: the shared contract, the resize props, and the root's own props, passed through. With
 * `isResizable`, `primaryWidth` is the starting width and the strip between the panes resizes the list pane.
 */
export type SplitViewProps = SplitViewContractProps & {
  /** True to draw a resize strip between the panes when they sit side by side (pointer and keyboard). */
  readonly isResizable?: boolean | undefined;
  /** The narrowest list pane a resize reaches, in pixels. Defaults to 240. */
  readonly minPrimaryWidth?: number | undefined;
  /** The widest list pane a resize reaches, in pixels. Defaults to 560. */
  readonly maxPrimaryWidth?: number | undefined;
  /** Called with the list pane's new width in pixels after each resize. */
  readonly onPrimaryWidthChange?: ((width: number) => void) | undefined;
  /** A local-storage key the resized width is kept under, so it survives a reload. */
  readonly storageKey?: string | undefined;
} & Omit<
    ComponentPropsWithoutRef<"div">,
    | keyof SplitViewContractProps
    | "isResizable"
    | "minPrimaryWidth"
    | "maxPrimaryWidth"
    | "onPrimaryWidthChange"
    | "storageKey"
  >;
