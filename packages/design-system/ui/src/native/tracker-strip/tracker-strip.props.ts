/**
 * Stackra file contract:
 * Purpose: `TrackerStripProps`, the props of the native `TrackerStrip` in `tracker-strip.tsx`: the shared contract and
 *          a class name.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371.
 */
import type { TrackerStripContractProps } from "#contracts/types/tracker-strip-contract-props.type";

/** Props of the native TrackerStrip. */
export type TrackerStripProps = TrackerStripContractProps & {
  /** Uniwind classes for the outer view, such as a margin. */
  readonly className?: string | undefined;
};
