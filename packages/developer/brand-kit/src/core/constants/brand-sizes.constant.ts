/**
 * Stackra file contract:
 * Purpose: `BRAND_SIZES`, the pixel sizes and output paths of every raster the generator writes: app icons per
 *          platform, the Android adaptive layers, splash images, favicons and web-manifest icons.
 * Boundary: data only; paths are relative to the output folder. A platform that adds a size changes this table, not a
 *           generator.
 * Runtime: isomorphic
 * Governing contract: ADR 0441 (as amended: D17, D18).
 */

/** One raster: where it goes and how wide it is. */
interface Raster {
  readonly path: string;
  readonly size: number;
}

/** Raster sizes per output kind. */
export const BRAND_SIZES = Object.freeze({
  /** Light app icons: iOS takes one 1024 icon, Android the five legacy mipmap densities, desktop three sizes. */
  appIcon: [
    { path: "icons/ios/app-icon-1024.png", size: 1024 },
    { path: "icons/android/mipmap-mdpi/ic_launcher.png", size: 48 },
    { path: "icons/android/mipmap-hdpi/ic_launcher.png", size: 72 },
    { path: "icons/android/mipmap-xhdpi/ic_launcher.png", size: 96 },
    { path: "icons/android/mipmap-xxhdpi/ic_launcher.png", size: 144 },
    { path: "icons/android/mipmap-xxxhdpi/ic_launcher.png", size: 192 },
    { path: "icons/desktop/icon-256.png", size: 256 },
    { path: "icons/desktop/icon-512.png", size: 512 },
    { path: "icons/desktop/icon-1024.png", size: 1024 },
  ] satisfies readonly Raster[],
  /** The iOS dark-appearance icon, from the dark source when the kit has one. */
  appIconDark: [
    { path: "icons/ios/app-icon-dark-1024.png", size: 1024 },
  ] satisfies readonly Raster[],
  /** Adaptive layers at xxxhdpi (108 dp x 4). */
  adaptive: {
    foreground: "icons/android/adaptive/foreground.png",
    monochrome: "icons/android/adaptive/monochrome.png",
    size: 432,
  },
  /** Splash images (Expo draws them centred on the background colour). */
  splash: { light: "splash/splash-light.png", dark: "splash/splash-dark.png", size: 1024 },
  /** Favicon PNGs packed into `favicon.ico`, and the Apple touch icon. */
  favicon: { ico: [16, 32, 48], appleTouch: { path: "favicon/apple-touch-icon.png", size: 180 } },
  /** Web-manifest icons. */
  web: [
    { path: "web/icon-192.png", size: 192 },
    { path: "web/icon-512.png", size: 512 },
  ] satisfies readonly Raster[],
});
