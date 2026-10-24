/**
 * Stackra file contract:
 * Purpose: `RealtimeStatus`, where the client's realtime connection stands: live, trying to connect, or down. The
 *          console's connection indicator maps each code to a label and a tone.
 * Boundary: an `Enum.of` value plus the type of the same name. A signed-out app has no connection at all
 *           (`useRealtimeConnection()` is `null`), which is not a status.
 * Runtime: isomorphic
 * Governing contract: ADR 0225 (decision 1); ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/** The three connection states. */
export const RealtimeStatus = Enum.of({
  /** The link is open; refreshes arrive. */
  Connected: "connected",
  /** A link is being opened, first or again after a loss. */
  Connecting: "connecting",
  /** No link: lost and waiting to retry, or suspended in the background. */
  Disconnected: "disconnected",
});

/** One of the codes above. */
export type RealtimeStatus = Enum.Value<typeof RealtimeStatus>;
