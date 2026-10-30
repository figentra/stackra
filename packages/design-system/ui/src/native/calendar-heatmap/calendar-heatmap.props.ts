/**
 * Stackra file contract:
 * Purpose: `CalendarHeatmapProps`, the props of the native `CalendarHeatmap` in `calendar-heatmap.tsx`: the shared contract and a class name.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371.
 */
import type { CalendarHeatmapContractProps } from "#contracts/types/calendar-heatmap-contract-props.type";

/** Props of the native CalendarHeatmap. */
export type CalendarHeatmapProps = CalendarHeatmapContractProps & {
  /** Classes for the figure, such as a width or margin. */
  readonly className?: string | undefined;
};
