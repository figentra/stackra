/**
 * Stackra file contract:
 * Purpose: `IdMinting`, who mints the public id of a record a queued offline call creates: the client, so the record
 *          is usable before the replay, or the server, on replay.
 * Boundary: an enum (`Enum.of`) of an action's `offline` option, copied by gen into the clients' offline map.
 * Runtime: isomorphic
 * Governing contract: ADR 0252 (decision 2: client-minted ids); ADR 0294 (decision 16: Enum).
 */
import { Enum } from "@stackra/contracts";

/**
 * Where a queued call's new id comes from.
 *
 * @example
 * offline: { mode: OfflineMode.Queue, idMinting: IdMinting.Client, ... }
 */
export const IdMinting = Enum.of({
  /** The client mints the public id and sends it in the input. */
  Client: "client",
  /** The server mints the id when the call replays. */
  Server: "server",
});

/** One of the values above. */
export type IdMinting = Enum.Value<typeof IdMinting>;
