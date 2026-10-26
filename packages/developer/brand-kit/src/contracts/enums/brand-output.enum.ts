/**
 * Stackra file contract:
 * Purpose: `BrandOutput`, the kinds of file the generator writes from one kit, so `--outputs`, the asset manifest and
 *          Runway's brand step (stackra-13) name the same kinds.
 * Boundary: an `Enum.of` value plus the type of the same name, in the leaf entry. Sizes, densities and device frames
 *           of each kind are kit or generator data, never codes here. Codes are snake_case.
 * Runtime: isomorphic
 * Governing contract: ADR 0441 (as amended: D17, D18, D19); ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/**
 * Generated file kinds.
 *
 * @example
 * const icons = manifest.files.filter((file) => file.output === BrandOutput.AppIcon);
 */
export const BrandOutput = Enum.of({
  /** Design tokens, generated through `@stackra/tokens`. */
  Tokens: "tokens",
  /** The HeroUI theme CSS. */
  HerouiCss: "heroui_css",
  /** App icons for iOS, Android and desktop. */
  AppIcon: "app_icon",
  /** Android adaptive icon layers. */
  AdaptiveIcon: "adaptive_icon",
  /** Splash screens. */
  Splash: "splash",
  /** Favicons. */
  Favicon: "favicon",
  /** The web app manifest. */
  WebManifest: "web_manifest",
  /** Store-screenshot device frames and captions from `assets/store`. */
  StoreFrame: "store_frame",
});

/** One of the codes above. */
export type BrandOutput = Enum.Value<typeof BrandOutput>;
