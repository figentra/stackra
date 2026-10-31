/**
 * Stackra file contract:
 * Purpose: `ChartExportContractProps`, the props of every runtime's `ChartExport`: the chart it wraps, the file name,
 *          the formats it offers and the raw numbers its CSV writes.
 * Boundary: types only. Web downloads the files; native shares them through the system sheet.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0307 (decisions 14 to 18); STA-1371.
 */
import type { ReactNode } from "react";

import type { ChartExportFormat } from "#contracts/enums/chart-export-format.enum";
import type { WidgetData } from "#contracts/types/widget-data.type";

/** Props shared by the web and native `ChartExport`. */
export interface ChartExportContractProps {
  /** The chart to save: any chart of the kit. */
  readonly children: ReactNode;
  /** The file name without its extension, such as "sales-october". */
  readonly fileName: string;
  /** The formats offered, in order; all three by default (native leaves out SVG). */
  readonly formats?: readonly ChartExportFormat[] | undefined;
  /**
   * The raw numbers the CSV writes. On web the chart's own data table is written when it is left out; native offers
   * CSV only with it.
   */
  readonly data?: WidgetData | undefined;
  /** The button's accessible name; "Download chart" on web and "Share chart" on native by default. */
  readonly label?: string | undefined;
}
