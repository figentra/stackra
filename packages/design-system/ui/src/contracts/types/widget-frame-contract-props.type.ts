/**
 * Stackra file contract:
 * Purpose: `WidgetFrameContractProps`, the props of every runtime's `WidgetFrame`: the card a dashboard widget draws in,
 *          with its title, description, header actions (a range, a menu), footer, grid size and body state.
 * Boundary: types only. The frame presents; it never fetches or computes (ADR 0307 decision 16).
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0307 (decisions 14 to 18); STA-1371.
 */
import type { ReactNode } from "react";

import type { ChartSort } from "#contracts/enums/chart-sort.enum";
import type { WidgetMenuAction } from "#contracts/enums/widget-menu-action.enum";
import type { WidgetSize } from "#contracts/enums/widget-size.enum";
import type { WidgetState } from "#contracts/enums/widget-state.enum";
import type { WidgetData } from "#contracts/types/widget-data.type";

/** Props shared by the web and native `WidgetFrame`. */
export interface WidgetFrameContractProps {
  /** The widget's title; it also names the region. */
  readonly title: string;
  /** A muted line under the title, such as the range shown. */
  readonly description?: ReactNode;
  /** Controls at the header's end: a range picker, a menu, a link to the full report. */
  readonly actions?: ReactNode;
  /** The body, drawn while `state` is `ready`. */
  readonly children?: ReactNode;
  /** A row under the body: a "View all" link, a last-updated note. */
  readonly footer?: ReactNode;
  /** What the body shows; `ready` by default. */
  readonly state?: WidgetState | undefined;
  /** The empty note; "No data for this range yet" by default. */
  readonly emptyText?: string | undefined;
  /** The error note; "This widget could not load" by default. */
  readonly errorText?: string | undefined;
  /** Shows a retry button in the error state. */
  readonly onRetry?: (() => void) | undefined;
  /** True while fresh data loads behind the current body: a quiet spinner in the header. */
  readonly isRefreshing?: boolean | undefined;
  /** The columns it spans in a 12-column dashboard grid (web); `medium` by default. Native fills the width. */
  readonly size?: WidgetSize | undefined;
  /** When the data was fetched: the header reads "Updated 2 min ago" in the locale and keeps it current. */
  readonly updatedAt?: Date | number | undefined;
  /** Shows a refresh button in the header that runs it; its icon spins while `isRefreshing` (still under reduced motion). */
  readonly onRefresh?: (() => void) | undefined;
  /** A row under the header for the body's own controls: a range or period picker, a filter. */
  readonly controls?: ReactNode;
  /** The overflow menu's entries, in this order; no menu when left out. `csv` and `table` read `data`. */
  readonly menu?: readonly WidgetMenuAction[] | undefined;
  /** The numbers behind the body: the "View as table" view, the accessible alternative, and the CSV download. */
  readonly data?: WidgetData | undefined;
  /** The downloads' file name without its extension; the title by default. */
  readonly fileName?: string | undefined;
  /** The order the body's categories are in; with `onSortChange`, the header shows a sort menu. */
  readonly sort?: ChartSort | undefined;
  /** Called with the order picked in the sort menu. */
  readonly onSortChange?: ((sort: ChartSort) => void) | undefined;
  /** Whether the previous period is drawn beside this one; with `onCompareChange`, the controls row shows a switch. */
  readonly isComparing?: boolean | undefined;
  /** Called when the compare switch is turned on or off. */
  readonly onCompareChange?: ((isComparing: boolean) => void) | undefined;
}
