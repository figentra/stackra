/**
 * Stackra file contract:
 * Purpose: `PromptMoment`, when an OS permission prompt is first shown (`PushConfig.askOn`, `PwaConfig.push.askOn`).
 * Boundary: an `Enum.of` value plus the type of the same name; read by the push context.
 * Runtime: isomorphic
 * Governing contract: ADR 0255 (decision 3); ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/** When the permission prompt first shows. */
export const PromptMoment = Enum.of({
  /** Once the first signed-in session starts. */
  FirstSession: "first_session",
  /** When the feature that needs it is first used. */
  FirstUse: "first_use",
  /** Only from the settings page. */
  Settings: "settings",
});

/** One of the codes above. */
export type PromptMoment = Enum.Value<typeof PromptMoment>;
