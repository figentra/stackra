/**
 * Stackra file contract:
 * Purpose: `WidgetFrameProps`, the props of the web `WidgetFrame`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0307 (decisions 14 to 18); STA-1371.
 */
import type { WidgetFrameContractProps } from "#contracts/types/widget-frame-contract-props.type";

/** Props of the web WidgetFrame. */
export type WidgetFrameProps = WidgetFrameContractProps & {
  readonly className?: string | undefined;
};
