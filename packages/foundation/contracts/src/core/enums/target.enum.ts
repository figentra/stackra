/**
 * Stackra file contract:
 * Purpose: the build targets of an app, the `targets` of `defineApp`; gen emits the outputs of the listed targets
 *          only.
 * Boundary: an `Enum.of` value plus the type of the same name; a build fact read from `stackra.config.ts`. A
 *           runtime target entry (`./server`, `./worker`, …) is a different thing, named by the entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0295 (decision 2), ADR 0249 (one app, web, PWA and desktop targets), ADR 0231 (snake_case
 *                     codes).
 */
import { Enum } from "#core/bases/enum.base";

/** One case per thing a user installs or opens. */
export const Target = Enum.of({
  /** The website. */
  Web: "web",
  /** The installable web app: manifests and the service worker. */
  Pwa: "pwa",
  /** The Electron desktop app. */
  Desktop: "desktop",
  /** The iOS app, through Expo. */
  Ios: "ios",
  /** The Android app, through Expo. */
  Android: "android",
});

/** One of the codes above. */
export type Target = Enum.Value<typeof Target>;
