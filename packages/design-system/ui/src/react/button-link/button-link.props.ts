/**
 * Stackra file contract:
 * Purpose: `ButtonLinkProps`, the props of the web `ButtonLink` in `button-link.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (one declaration per file); ADR 0302 (decision 3); ADR 0165 (HeroUI v3 on web);
 *          STA-2041 (the landing's core pill).
 */
import type { ReactNode } from "react";
import type { LinkProps as AriaLinkProps } from "react-aria-components";

import type { ButtonShape } from "#contracts/enums/button-shape.enum";
import type { ButtonVariant } from "#contracts/enums/button-variant.enum";
import type { Size } from "#contracts/enums/size.enum";

/**
 * Props of the web ButtonLink: React Aria's link props (the `href` required) plus the Button's look: `variant`,
 * `shape` and `size`, with the Button's defaults.
 */
export interface ButtonLinkProps extends Omit<AriaLinkProps, "children" | "className" | "style"> {
  /** Where the link goes; an internal one navigates through the nearest `RouterProvider`. */
  readonly href: NonNullable<AriaLinkProps["href"]>;
  /** The visible words, which are also the link's spoken name. */
  readonly children: ReactNode;
  /** The emphasis and colour, as the Button's. Defaults to `primary`. */
  readonly variant?: ButtonVariant | undefined;
  /** The corner: the theme's own (`default`) or a full pill (`pill`). Defaults to `default`. */
  readonly shape?: ButtonShape | undefined;
  /** The height, padding and text size, as the Button's. Defaults to `md`. */
  readonly size?: Size | undefined;
  /** Styles the link. */
  readonly className?: string | undefined;
}
