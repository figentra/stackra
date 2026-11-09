/**
 * Stackra file contract:
 * Purpose: `BrandReader`, the one reader every surface asks for a brand: `profile(locale)` resolves `BrandingSettings`
 *          (tenant, then platform, then plain) into a `BrandProfile`: the display name for the locale (else the other
 *          base locale, else `null`), the logo and the mark as stored files with their variant URLs (the mark falls
 *          back to the logo), and each colour with its on-colour. A colour that fails its contrast rule
 *          (`brandColorRefusals`) counts as unset: the next layer out that holds a readable one wins, else `null`.
 * Boundary: reads through `SettingsReader#get`, which layers platform under tenant field by field and parses the group
 *           (formats only, never contrast, so one tenant's bad colour never breaks its reads); only when a resolved
 *           colour fails does it read the group's stored layers from the `SettingValueStore` to find the fallback. It
 *           asks the media `FileSystem` disk only whether a claimed file exists and for its public URL. It never writes
 *           and holds no cache: every call reads the settings and checks the disk (README, known limits). An id whose
 *           file is gone (never claimed, deleted) reads as `null`.
 * Runtime: isomorphic
 * Governing contract: ADR 0222 (decisions 1, 3 and 4); ADR 0263 (classes are the tokens); ADR 0307 (rule 24);
 *                     STA-2644 (FR-004).
 */
import { Service } from "@stackra/container";
import type { PublicId } from "@stackra/contracts";
import type { FileSystem } from "@stackra/filesystem/contracts";
import type { Locale } from "@stackra/i18n";
import type { ImageVariant, ImageVariantOptions } from "@stackra/media";
import { BucketVisibility } from "@stackra/media";
import type { SettingsReader } from "@stackra/settings";
import type { SettingTarget, SettingValue, SettingValueStore } from "@stackra/settings/contracts";

import type { BrandColor, BrandImage, BrandProfile } from "#contracts/index";
import { brandColorRefusals, BrandingSettings, onColor } from "#core/index";
import type { BrandDisplayName } from "#core/index";
import { BRAND_ASSET_TYPES } from "#node/constants/brand-asset-types.constant";
import { BRAND_ASSET_VARIANTS } from "#node/constants/brand-asset-variants.constant";
import { BRAND_ASSETS_BUCKET_KEY } from "#node/constants/brand-assets-bucket-key.constant";

/** Where a claimed brand file lives: `<visibility>/<bucket key as folders>/`. */
// shortcut: mirrors media's internal `filePathOf` layout; ask MediaLibrary once it can look a file up by id.
const FOLDER = `${BucketVisibility.Public}/${BRAND_ASSETS_BUCKET_KEY.replaceAll(".", "/")}/`;

/** The settings group key gen derives from `BrandingSettings`. */
const GROUP = "branding";

/** A `#RRGGBB` colour. */
const HEX = /^#[0-9A-Fa-f]{6}$/;

/** A brand colour setting's path in the group. */
type ColorPath = "primaryColor" | "accentColor";

/** Whether `value` is a `#RRGGBB` colour that passes the contrast rule of the setting at `path`. */
function isReadable(path: ColorPath, value: SettingValue | undefined): value is string {
  return (
    typeof value === "string" &&
    HEX.test(value) &&
    brandColorRefusals({ primaryColor: null, accentColor: null, [path]: value }).length === 0
  );
}

/** The name for `locale`'s language, else the other base locale's; blank counts as unset. */
function displayNameFor(names: BrandDisplayName, locale: Locale): string | null {
  const order = locale.startsWith("ar") ? [names.ar, names.en] : [names.en, names.ar];
  return order.find((name) => name !== null && name.trim() !== "") ?? null;
}

/** The resized image of `url` at `box`. */
// shortcut: the media resizer's `w`/`h` query form, copied from media's internal `imageVariantUrl`; import it once media
// exports it.
function variantOf(url: string, box: ImageVariantOptions): ImageVariant {
  const query = new URLSearchParams({ w: String(box.width) });
  if (box.height !== undefined) query.set("h", String(box.height));
  return {
    url: `${url}${url.includes("?") ? "&" : "?"}${query.toString()}`,
    width: box.width,
    ...(box.height === undefined ? {} : { height: box.height }),
  };
}

/**
 * Resolves the brand of the running call's tenant.
 *
 * @example
 * const brand = await this.brand.profile(Locale.Ar);
 * html.logo = brand.logo?.variants.email.url;
 */
export class BrandReader extends Service {
  /** The settings cascade. */
  private readonly settings: SettingsReader;

  /** The stored layers, read only to find a fallback for a colour that fails its rule. */
  private readonly store: SettingValueStore;

  /** The media disk the brand files were claimed onto. */
  private readonly disk: FileSystem;

  /**
   * @param settings - reads `BrandingSettings`.
   * @param store - the settings value store `settings` reads.
   * @param disk - the one `FileSystem` disk media stores on.
   */
  constructor(settings: SettingsReader, store: SettingValueStore, disk: FileSystem) {
    super();
    this.settings = settings;
    this.store = store;
    this.disk = disk;
  }

  /**
   * The resolved profile in `locale`, at `target` (the running scope session's node when left out). It never throws on
   * a stored value: a malformed one reads as unset and a low-contrast colour is skipped.
   */
  async profile(locale: Locale, target: SettingTarget = {}): Promise<BrandProfile> {
    const brand = await this.settings.get(BrandingSettings, target);
    const [logo, mark, primary, accent] = await Promise.all([
      this.imageOf(brand.logo),
      this.imageOf(brand.mark),
      this.colorOf("primaryColor", brand.primaryColor, target),
      this.colorOf("accentColor", brand.accentColor, target),
    ]);
    return {
      displayName: displayNameFor(brand.displayName, locale),
      logo,
      mark: mark ?? logo,
      primary,
      accent,
    };
  }

  /**
   * The colour at `path` with its on-colour: `resolved` when it passes its rule, else the innermost stored layer's
   * value that does, else `null`.
   */
  private async colorOf(
    path: ColorPath,
    resolved: string | null,
    target: SettingTarget,
  ): Promise<BrandColor | null> {
    let color: string | null = resolved;
    if (color !== null && !isReadable(path, color)) {
      // Layers come outermost first, so walk them from the target's own outwards.
      const layers = await this.store.layers(GROUP, target);
      color = null;
      for (let at = layers.length - 1; at >= 0 && color === null; at--) {
        const value = layers[at]?.values[path];
        if (isReadable(path, value)) color = value;
      }
    }
    return color === null ? null : { color, onColor: onColor(color) };
  }

  /** The claimed file of upload `id` with its variants, or `null` when unset or not on the disk. */
  private async imageOf(id: string | null): Promise<BrandImage | null> {
    if (id === null) return null;
    for (const mediaType of BRAND_ASSET_TYPES) {
      const path = `${FOLDER}${id}.${mediaType.slice(mediaType.indexOf("/") + 1)}`;
      if (!(await this.disk.exists(path))) continue;
      const url = this.disk.url(path);
      return {
        id: id as PublicId<"upl">,
        url,
        mediaType,
        variants: {
          print: variantOf(url, BRAND_ASSET_VARIANTS.print),
          email: variantOf(url, BRAND_ASSET_VARIANTS.email),
          mark: variantOf(url, BRAND_ASSET_VARIANTS.mark),
        },
      };
    }
    return null;
  }
}
