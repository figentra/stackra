/**
 * Stackra file contract:
 * Purpose: `WidgetRenderer`, the component a Custom widget renders with on one runtime: a function or a compiled class
 *          component taking `CustomWidgetProps`.
 * Boundary: a type only, free of React so the core entry stays isomorphic; the web and native slots render it.
 * Runtime: isomorphic
 * Governing contract: ADR 0164 (0294 note); ADR 0305 (rules 37 to 39: class components compile to functions).
 */
import type { CustomWidgetProps } from "#core/types/custom-widget-props.type";

/** A Custom widget's renderer. */
export type WidgetRenderer =
  | ((props: CustomWidgetProps<never>) => unknown)
  | (abstract new (props: CustomWidgetProps<never>) => object);
