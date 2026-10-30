/**
 * Stackra file contract:
 * Purpose: `SidePanelProps`, the props of the native `SidePanel` in `side-panel.tsx`: the shared contract only.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12); ADR 0302 (decision 3, adapted forms); owner request 2026-10-29
 *          (STA-1371, side panel).
 */
import type { SidePanelContractProps } from "#contracts/types/side-panel-contract-props.type";

/** Props of the native SidePanel: the shared contract. There is no width, resize or launcher on native. */
export type SidePanelProps = SidePanelContractProps;
