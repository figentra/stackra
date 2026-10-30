/**
 * Stackra file contract:
 * Purpose: `WidgetFrameProps`, the props of the native `WidgetFrame`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303; STA-1371.
 */
import type { WidgetFrameContractProps } from "#contracts/types/widget-frame-contract-props.type";

/** Props of the native WidgetFrame. */
export type WidgetFrameProps = WidgetFrameContractProps & {
  readonly className?: string | undefined;
};
