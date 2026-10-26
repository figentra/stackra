/**
 * Stackra file contract:
 * Purpose: `BrandKit`, a product's brand kit configuration (`assets/brand/kit.json`) with every default filled in: its
 *          id and names, the theme file and the symbol it is drawn from, and the knobs of each generated set (app and
 *          adaptive icons, splash screens, favicons and the web manifest, store-screenshot frames) plus the kit check.
 * Boundary: type only. Colours are never values here: each set names theme colour roles, and the theme file holds the
 *           colours. A kit's own extra fields (a parent kit, an endorsement rule) are the owner's data and pass through
 *           untouched; this package reads none of them.
 * Runtime: isomorphic
 * Governing contract: ADR 0441 (decisions 4 and 5), ADR 0340 decision 10 as amended by 0441.
 */
import type { ColorRole } from "@stackra/tokens/contracts";

/** A parsed kit, defaults applied. */
export interface BrandKit {
  /** The kit id: the product key, lower-case kebab. */
  readonly id: string;

  /** The product's name per locale; `en` is required. */
  readonly name: Readonly<Record<string, string>>;

  /** The short name for the home screen; the English name when absent. */
  readonly shortName: string;

  /** The theme file, relative to the kit: a full theme, a changes-only diff over the stackra theme, or a bare theme. */
  readonly theme: string;

  /** The square symbol SVG every icon is drawn from, relative to the kit; it paints with `currentColor`. */
  readonly symbol: string;

  /** App icons: a full-bleed square the platforms mask themselves. */
  readonly icon: {
    /** The tile's colour role. */
    readonly background: ColorRole;
    /** The symbol's colour role. */
    readonly foreground: ColorRole;
    /** The symbol's share of the tile's side, 0 to 1. */
    readonly scale: number;
    /** The corner radius of the web tiles (favicon, PWA icons) as a share of the side; app stores mask their own. */
    readonly radius: number;
    /** The app icon sizes in pixels. */
    readonly sizes: readonly number[];
  };

  /** Splash screens: the symbol alone, the colour behind it in the app config. */
  readonly splash: {
    /** The screen's colour role. */
    readonly background: ColorRole;
    /** The symbol's colour role. */
    readonly foreground: ColorRole;
    /** The symbol's share of the image's side, 0 to 1. */
    readonly scale: number;
    /** The image's side in pixels. */
    readonly size: number;
  };

  /** The web app manifest. */
  readonly manifest: {
    /** The `display` mode. */
    readonly display: string;
    /** The `start_url`. */
    readonly startUrl: string;
  };

  /** Store-screenshot frames: a caption over each captured screen. */
  readonly store: {
    /** The frame's colour role. */
    readonly background: ColorRole;
    /** The caption's colour role. */
    readonly foreground: ColorRole;
    /** The caption's size as a share of the frame's width. */
    readonly captionSize: number;
    /** The frame sizes each screen is set in (`id` names the output folder). */
    readonly frames: readonly {
      readonly id: string;
      readonly width: number;
      readonly height: number;
    }[];
    /** The caption font per locale or language, relative to the kit; `default` covers the rest. */
    readonly fonts: Readonly<Record<string, string>>;
  };

  /** What `check` requires beyond its fixed rules. */
  readonly check: {
    /** Files that must exist, relative to the kit. */
    readonly requiredFiles: readonly string[];
    /** Mark names a kit carries: some SVG under `logos/` or `marks/` starts with each. */
    readonly requiredMarks: readonly string[];
  };
}
