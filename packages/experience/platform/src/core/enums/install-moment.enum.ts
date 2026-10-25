/**
 * Stackra file contract:
 * Purpose: `InstallMoment`, when a downloaded desktop update is installed (`DesktopConfig.updates.installOn`).
 * Boundary: an `Enum.of` value plus the type of the same name; read by the Electron main process.
 * Runtime: isomorphic
 * Governing contract: ADR 0254 (update feed and channels); ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/** When a downloaded update installs. */
export const InstallMoment = Enum.of({
  /** When the user quits the app. */
  Quit: "quit",
  /** At once, restarting the app. */
  Immediately: "immediately",
  /** When the user accepts the in-app prompt. */
  Prompt: "prompt",
});

/** One of the codes above. */
export type InstallMoment = Enum.Value<typeof InstallMoment>;
