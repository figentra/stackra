/**
 * Stackra file contract:
 * Purpose: `BrandLogo`, the theming kit's logo on native: the theme's own logo, or the host's for the scheme on
 *          screen, at a height, letterboxed in its box; the fallback while there is none.
 * Boundary: composition of @stackra/ui/native's `Thumbnail` (fade in, broken-image icon) over `useBrandLogo` (the
 *           isomorphic hook of the react entry). An image named by `label`, hidden from VoiceOver and TalkBack without
 *           it. No radius and no fill of its own. React Native's Image draws no SVG, so the logo is a raster URL.
 * Runtime: react-native
 * Governing contract: ADR 0504 (module UI kits); ADR 0060 (light and dark); ADR 0234 (asset URLs); ADR 0302
 *                     (decision 3: native UI from @stackra/ui).
 */
import { Thumbnail } from "@stackra/ui/native";
import type { ReactElement } from "react";

import type { BrandLogoProps } from "#native/brand-logo/brand-logo.props";
import { useBrandLogo } from "#react/brand-logo/use-brand-logo";

/**
 * The brand's logo.
 *
 * @example
 * <BrandLogo height={28} aspectRatio={4} label="Acme" fallback={<Text>Acme</Text>} />
 */
export function BrandLogo({
  height = 32,
  fallback = null,
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
      style={{ width: height * aspectRatio }}
      {...(label === undefined ? {} : { alt: label })}
    />
  );
}
