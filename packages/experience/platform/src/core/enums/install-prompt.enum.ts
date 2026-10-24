/**
 * Stackra file contract:
 * Purpose: `InstallPrompt`, which install prompt the PWA shows (`PwaConfig.install.prompt`): the browser's own, the
 *          app's house prompt (through the `install` facet), or none.
 * Boundary: an `Enum.of` value plus the type of the same name; data only.
 * Runtime: isomorphic
 * Governing contract: ADR 0255; ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/** Which install prompt shows. */
export const InstallPrompt = Enum.of({
  /** The browser's own prompt, when it chooses. */
  Browser: "browser",
  /** The app's own prompt, shown through `platform.install.prompt()`. */
  House: "house",
  /** No prompt. */
  Never: "never",
});

/** One of the codes above. */
export type InstallPrompt = Enum.Value<typeof InstallPrompt>;
