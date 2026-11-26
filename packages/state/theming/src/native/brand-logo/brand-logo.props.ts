/**
 * Stackra file contract:
 * Purpose: `BrandLogoProps`, what a host hands the native BrandLogo: its height, what to draw with no logo, an
 *          optional logo per scheme in place of the theme's, the scheme to draw, the logo's width over height and its
 *          name.
 * Boundary: an interface in its own file beside the component (ADR 0305). The theme's logo and the scheme on screen
 *           are the container's (`ThemingConfig`, `ColorSchemeService`), never props; `logo` and `mode` only override
 *           them. The name is the host's words (ADR 0504 decision 4).
 * Runtime: react-native
 * Governing contract: ADR 0504 (module UI kits); ADR 0060 (light and dark); ADR 0305.
 */
import type { ResolvedColorScheme } from "@stackra/ui/contracts";
import type { ReactNode } from "react";

import type { BrandLogoSource } from "#core/types/brand-logo-source.type";

/**
 * The logo's height, fallback and overrides.
 *
 * @example
 * <BrandLogo height={28} aspectRatio={4} label="Acme" fallback={<Text>Acme</Text>} />
 */
export interface BrandLogoProps {
  /** The height, in points. Defaults to 32. */
  readonly height?: number | undefined;
  /** What shows while there is no logo, such as the brand name as text; nothing by default. */
  readonly fallback?: ReactNode;
  /** A logo per scheme in place of the theme's; defaults to the theme's own. */
  readonly logo?: BrandLogoSource | undefined;
  /** The scheme to draw the logo for; defaults to the scheme on screen. */
  readonly mode?: ResolvedColorScheme | undefined;
  /** Width over height; 4 for a wordmark four times as wide as it is tall. Defaults to 1, a square mark. */
  readonly aspectRatio?: number | undefined;
  /** The spoken name, such as the brand's; leave it out when the name is written beside the logo. */
  readonly label?: string | undefined;
  /** Styles the root. */
  readonly className?: string | undefined;
}
