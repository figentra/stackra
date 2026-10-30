/**
 * Stackra file contract:
 * Purpose: `SmokeSubject`, one thing the smoke step checks after a preview deploy: a web surface at its preview URL,
 *          a mobile app's simulator build on one platform, or a desktop app's build.
 * Boundary: type only; `smokePreview` lists the subjects from the root runway and a `SmokeDriver` of the same target
 *           checks each.
 * Runtime: isomorphic
 * Governing contract: STA-265 spec (D6, FR-008).
 */

/** One subject of the smoke step. */
export type SmokeSubject =
  | {
      readonly target: "web";
      /** The surface key. */
      readonly name: string;
      /** The surface's canonical preview URL. */
      readonly url: string;
    }
  | {
      readonly target: "mobile";
      /** The app key. */
      readonly name: string;
      readonly platform: "ios" | "android";
      /** The Release simulator build (`.app` or `.apk`). */
      readonly appPath: string;
      /** The template line checkout holding the Maestro flows. */
      readonly templateDir: string;
    }
  | {
      readonly target: "desktop";
      /** The app key. */
      readonly name: string;
      /** The packaged Electron app. */
      readonly appPath: string;
    };
