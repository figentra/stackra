/**
 * Stackra file contract:
 * Purpose: `TrackerStripProps`, the props of the web `TrackerStrip` in `tracker-strip.tsx`: the shared contract and a
 *          class name.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371.
 */
import type { TrackerStripContractProps } from "#contracts/types/tracker-strip-contract-props.type";

/** Props of the web TrackerStrip. */
export type TrackerStripProps = TrackerStripContractProps & {
  /** Classes for the figure, such as a width or margin. */
  readonly className?: string | undefined;
};
