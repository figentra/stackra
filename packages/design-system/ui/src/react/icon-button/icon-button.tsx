/**
 * Stackra file contract:
 * Purpose: the web `IconButton`: the Button in HeroUI's icon-only shape, its accessible name required by the type.
 * Boundary: builds on `#react/button/button`; adds no behaviour, so loading swaps the icon for the spinner exactly as
 *          the Button does.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); WCAG 2.2 SC 4.1.2 (name, role, value).
 */
import type { ReactElement } from "react";
import { Button } from "#react/button/button";
import type { IconButtonProps } from "#react/icon-button/icon-button.props";

// `isIconOnly` is kept off Button's public props so an icon-only button always has a label; IconButton is its one
// caller. TypeScript checks no excess property on a JSX spread, and Button forwards it to HeroUI.
const ICON_ONLY = { isIconOnly: true } as const;

/** A button that shows one icon and no text; `label` is its accessible name. */
export function IconButton({ icon, label, ...rest }: IconButtonProps): ReactElement {
  return <Button {...rest} label={label} startIcon={icon} {...ICON_ONLY} />;
}
