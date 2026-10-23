/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./react` entry of @stackra/ui, which has several public files, until `stackra gen`
 *          writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing.
 * Runtime: browser
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { Button, type ButtonProps } from "#react/button/button";
export { CloseButton, type CloseButtonProps } from "#react/close-button/close-button";
export { DesignSystemProvider } from "#react/design-system-provider/design-system-provider";
export { useDesignSystem } from "#react/design-system-provider/use-design-system";
export { Heading, type HeadingProps } from "#react/heading/heading";
export { IconButton, type IconButtonProps } from "#react/icon-button/icon-button";
export { Icon, type IconProps } from "#react/icon/icon";
export { Link, type LinkProps } from "#react/link/link";
// The one router seam of the web kit: React Aria's own provider, re-exported so apps import UI only from here.
export { RouterProvider } from "react-aria-components";
export { Text, type TextProps } from "#react/text/text";
// Web-only HeroUI components with nothing to unify with native, so they keep HeroUI's own API (ADR 0303 decision 6).
export { ToggleButton, ToggleButtonGroup, Toolbar } from "@heroui/react";
