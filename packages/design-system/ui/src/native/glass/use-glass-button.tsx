/**
 * Stackra file contract:
 * Purpose: `useGlassButton(variant, isDisabled)`, the native glass look of the quiet button variants (ADR 0319):
 *          secondary, tertiary and outline draw on Liquid Glass (a regular, interactive `GlassView` in the colour
 *          scheme) where `useGlassMaterial()` says `liquid`. It returns the HeroUI Native `background` layer and the
 *          class that clears the variant's own fill, or nothing when the button stays solid.
 * Boundary: the layer only. The label keeps the variant's foreground colour, so its contrast is the one it has on the
 *           solid surface. Ghost keeps HeroUI's look (native has no hover), primary and danger stay solid, and a
 *           disabled button is solid too: HeroUI Native dims the root to half opacity, which would dim the glass with
 *           it. Adjacent glass controls (a toolbar row) are grouped in a `GlassContainer` by the component that lays
 *           them out, not here.
 * Runtime: react-native
 * Governing contract: ADR 0319 (decisions 2 and 3); ADR 0320 (decision 7); ADR 0302 (decision 3).
 */
import { Button as HeroButton } from "heroui-native";

import type { ButtonVariant } from "#contracts/enums/button-variant.enum";

import { GlassLayer } from "#native/glass/glass-layer";
import { useGlassMaterial } from "./use-glass-material";
import type { GlassButtonLook } from "#native/glass/glass-button-look.type";

/** The variants that draw on glass; the web's glass ghost exists only under a pointer. */
const GLASS_VARIANTS: ReadonlySet<ButtonVariant> = new Set(["secondary", "tertiary", "outline"]);

/**
 * The glass look of `variant`, agreed by Button, IconButton and CloseButton.
 * @param variant - the button's variant, after its default
 * @param isDisabled - the button's disabled flag; a disabled button is solid
 * @returns the background layer and class, or `undefined` when the button draws HeroUI's solid look
 */
export function useGlassButton(
  variant: ButtonVariant,
  isDisabled = false,
): GlassButtonLook | undefined {
  const material = useGlassMaterial();
  if (material === "solid" || isDisabled || !GLASS_VARIANTS.has(variant)) return undefined;
  return {
    background: (
      <HeroButton.Background>
        <GlassLayer />
      </HeroButton.Background>
    ),
    className: "bg-transparent",
  };
}
