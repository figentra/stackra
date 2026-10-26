/**
 * Stackra file contract:
 * Purpose: the native `IconButton`: the Button in HeroUI Native's icon-only shape, its accessible name required by
 *          the type.
 * Boundary: builds on `#native/button/button`; adds no behaviour, so loading swaps the icon for the spinner exactly
 *          as the Button does.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); WCAG 2.2 SC 4.1.2 (name, role, value).
 */
import { Button } from "#native/button/button";
import type { IconButtonProps } from "#native/icon-button/icon-button.props";

// `isIconOnly` is kept off Button's public props so an icon-only button always has a label; IconButton is its one
// caller. TypeScript checks no excess property on a JSX spread, and Button forwards it to HeroUI Native.
const ICON_ONLY = { isIconOnly: true } as const;

/** A button that shows one icon and no text; `label` is its accessible name. */
export function IconButton({ icon, label, ...rest }: IconButtonProps) {
  return <Button {...rest} label={label} startIcon={icon} {...ICON_ONLY} />;
}
