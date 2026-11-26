/**
 * Stackra file contract:
 * Purpose: `BrandLogo`, the theming kit's logo on the web: the theme's own logo, or the host's for the scheme on
 *          screen, at a height, letterboxed in its box; the fallback while there is none.
 * Boundary: composition of @stackra/ui's `Thumbnail` (lazy load, fade in, broken-image icon) over `useBrandLogo`. An
 *           image named by `label`, decorative without it. No radius and no fill of its own, so the logo's own shape
 *           shows.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0060 (light and dark); ADR 0234 (asset URLs); ADR 0302
 *                     (decision 3: UI from @stackra/ui); WCAG 2.2 SC 1.1.1.
 */
import { Thumbnail } from "@stackra/ui/react";
import type { ReactElement } from "react";

import type { BrandLogoProps } from "#react/brand-logo/brand-logo.props";
import { useBrandLogo } from "#react/brand-logo/use-brand-logo";

/**
 * The brand's logo.
 *
 * @example
 * <BrandLogo size={32} aspectRatio={4} label="Acme" fallback={<Text>Acme</Text>} />
 */
export function BrandLogo({
  size,
  fallback,
  logo,
  mode,
  aspectRatio = 1,
  label,
  className,
}: BrandLogoProps): ReactElement {
  const src = useBrandLogo(logo, mode);
  if (src === null) return <>{fallback}</>;
  return (
    <Thumbnail
      src={src}
      fit="contain"
      aspectRatio={aspectRatio}
      className={`rounded-none bg-transparent ${className ?? ""}`}
      style={{ width: size * aspectRatio }}
      {...(label === undefined ? {} : { alt: label })}
    />
  );
}
