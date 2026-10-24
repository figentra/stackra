/**
 * Stackra file contract:
 * Purpose: the native `Tooltip`, an adapted form (ADR 0302 decision 3): HeroUI Native has no tooltip and iOS and
 *          Android draw none, so the text becomes the accessibility hint of the element it describes, which a screen
 *          reader speaks after the element's name. The props are the shared contract, so one call site serves both
 *          runtimes.
 * Boundary: built on no HeroUI part and draws nothing. `isOpen`, `defaultOpen`, `onOpenChange`, `placement`, `align` and
 *           `hasArrow` are accepted and unread, because there is no overlay to open or place. An element that already
 *           carries its own `accessibilityHint` keeps it.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0312; WCAG 2.2 SC 4.1.2.
 */
import { cloneElement, type ReactElement } from "react";

import type { TooltipContractProps } from "#contracts/types/tooltip-contract-props.type";

/** Props of the native Tooltip: the shared contract only; there is no HeroUI Native tooltip to pass props to. */
export type TooltipProps = TooltipContractProps;

/** The props of the element a tooltip describes that it reads and sets. */
interface HintedProps {
  readonly accessibilityHint?: string | undefined;
}

/**
 * Adds the tooltip text to an element as its accessibility hint; the element is drawn as it was.
 * @param props - the element to describe and the text
 * @returns the element, with the hint set unless it already had one
 */
export function Tooltip({ children, content }: TooltipProps): ReactElement {
  // A cast: the contract takes any element, and the hint is the one prop every React Native pressable accepts.
  const element = children as ReactElement<HintedProps>;
  return cloneElement(element, { accessibilityHint: element.props.accessibilityHint ?? content });
}
