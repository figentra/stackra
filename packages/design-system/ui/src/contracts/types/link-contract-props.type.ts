/**
 * Stackra file contract:
 * Purpose: the props every runtime's `Link` takes, on web (`./react`) and native (`./native`): where the link goes,
 *          how it is announced, its tone and underline, and whether it leaves the app. Each runtime's `LinkProps` is
 *          this plus its HeroUI component's own props. The link is router-free: an internal `href` reaches the app's
 *          router through the nearest `RouterProvider`, never through an import.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303 (decision 7); ADR 0165 (UI
 *          contract); ADR 0060 (RTL).
 */
import type { ReactNode } from "react";

import type { LinkUnderline } from "#contracts/enums/link-underline.enum";
import type { Tone } from "#contracts/enums/tone.enum";

/** Props shared by the web and native `Link`. */
export interface LinkContractProps {
  /** The text (or content) of the link; a link without text needs `label`. */
  readonly children?: ReactNode;
  /** Where the link goes: an app path (`/orders/ord_1`) for the router, or an absolute URL (`https:`, `mailto:`). */
  readonly href?: string | undefined;
  /** Called when the link is activated, before the link follows `href`. */
  readonly onPress?: (() => void) | undefined;
  /** Whether the link is inert: not focusable, not pressable, announced as disabled. Defaults to false. */
  readonly isDisabled?: boolean | undefined;
  /** Whether the link leaves the app: a new tab on web, the system browser on native, with the external mark. */
  readonly isExternal?: boolean | undefined;
  /** The semantic colour of the link text. Defaults to `default`, the theme's link colour. */
  readonly tone?: Tone | undefined;
  /** When the underline shows: `always` (default; required inside running text) or `hover` (standalone links). */
  readonly underline?: LinkUnderline | undefined;
  /** The accessible name when the visible content is not text (an icon-only link), or must be more specific. */
  readonly label?: string | undefined;
  /** What assistive technology hears for an external link. Defaults to an English phrase until i18n ships. */
  readonly externalLabel?: string | undefined;
}
