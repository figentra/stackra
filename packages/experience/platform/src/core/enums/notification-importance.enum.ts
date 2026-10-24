/**
 * Stackra file contract:
 * Purpose: `NotificationImportance`, the importance of an Android notification channel
 *          (`PushConfig.androidChannels[].importance`): how loudly the channel's notifications interrupt.
 * Boundary: an `Enum.of` value plus the type of the same name; the native push context maps each code to the
 *           platform's importance level when it creates the channel.
 * Runtime: isomorphic
 * Governing contract: ADR 0255 (decision 3); ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/** How much a channel's notifications interrupt. */
export const NotificationImportance = Enum.of({
  /** No sound, no status-bar icon. */
  Min: "min",
  /** No sound. */
  Low: "low",
  /** Sound. */
  Default: "default",
  /** Sound and a heads-up banner. */
  High: "high",
  /** Sound, banner and full-screen where allowed. */
  Max: "max",
});

/** One of the codes above. */
export type NotificationImportance = Enum.Value<typeof NotificationImportance>;
