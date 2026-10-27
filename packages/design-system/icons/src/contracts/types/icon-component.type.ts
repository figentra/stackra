/**
 * Stackra file contract:
 * Purpose: the shape of a component a registry holds: any component that takes a pixel size, a colour and a stroke
 *          width. Every Lucide icon is one, on web (`lucide-react`) and on native (`lucide-react-native`), and so is
 *          an app's own SVG component with the same props.
 * Boundary: types only; the props live in `icon-component-props.type.ts`. No icon library is imported here, so the
 *           contract stays free of either runtime's package.
 * Runtime: isomorphic
 * Governing contract: ADR 0303 (decision 10); ADR 0302 (decision 3: one API, the contract shared); ADR 0165.
 */
import type { ComponentType } from "react";

import type { IconComponentProps } from "#contracts/types/icon-component-props.type";

/** A component a registry can hold: a Lucide icon such as `ArrowRight`, or any component taking the same props. */
export type IconComponent = ComponentType<IconComponentProps>;
