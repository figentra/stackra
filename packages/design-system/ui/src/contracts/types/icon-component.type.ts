/**
 * Stackra file contract:
 * Purpose: the shape of a component `Icon` can draw: any component that takes a pixel size, a colour and a stroke
 *          width. Every Lucide icon is one, on web (`lucide-react`) and on native (`lucide-react-native`), and so is an
 *          app's own SVG component with the same props.
 * Boundary: types only; no icon library is imported here, so the contract stays free of either runtime's package.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API, the contract shared); ADR 0303 (decision 3: icons are Lucide);
 *          ADR 0165 (UI contract).
 */
import type { ComponentType } from "react";

/** The props `Icon` hands the component it draws; a component may ignore any of them. */
export interface IconComponentProps {
  /** The width and height in pixels, from the icon size: `sm` 16, `md` 20, `lg` 24. */
  readonly size?: number | string;
  /** The stroke colour, a resolved colour; native only, the web icon draws in `currentColor`. */
  readonly color?: string;
  /** The stroke width on the icon's 24-unit grid; Lucide draws 2 when it is left out. */
  readonly strokeWidth?: number | string;
}

/** A component `Icon` can draw: a Lucide icon such as `ChevronRight`, or any component taking the same props. */
export type IconComponent = ComponentType<IconComponentProps>;
