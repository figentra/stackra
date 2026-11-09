/**
 * Stackra file contract:
 * Purpose: the `valkey` driver of the `RealtimeTokenLedger` port: a redeemed token id is a Valkey key set with
 *          `SET NX PX` for the time left on the token, so every instance of the service sees one redemption.
 * Boundary: server only (iovalkey). It shares the fan-out's server (`REALTIME_VALKEY_URL`), under its own key prefix
 *           (`<fanoutChannel>:token:`). A failed call rejects, so the token is refused rather than redeemed twice.
 * Runtime: node
 * Governing contract: ADR 0225 (decision 1); ADR 0346 (decision 3); ADR 0150 (the Valkey client); ADR 0173.
 */
import { Driver } from "@stackra/container";
import Valkey from "iovalkey";

import type { RealtimeConfig } from "#config/realtime.config";
import { RealtimeTokenLedger } from "#contracts/ports/realtime-token-ledger.port";

/**
 * Records redeemed token ids in Valkey.
 *
 * @example
 * const ledger = new ValkeyRealtimeTokenLedgerDriver(config);
 * await ledger.claim(id, expiresAt); // true once, false after
 */
export class ValkeyRealtimeTokenLedgerDriver extends Driver(RealtimeTokenLedger) {
  /** The connection, public so a test or the host can close it. */
  readonly client: Valkey;

  private readonly prefix: string;

  /**
   * @param config - the server (`fanoutValkeyUrl`, the `REALTIME_VALKEY_URL` secret) and the channel the prefix uses.
   * @throws TypeError when the `REALTIME_VALKEY_URL` secret is not set.
   */
  constructor(config: RealtimeConfig) {
    super();
    if (config.fanoutValkeyUrl === "")
      throw new TypeError(
        "The valkey realtime token ledger needs a server: set the REALTIME_VALKEY_URL secret",
      );
    this.prefix = `${config.fanoutChannel}:token:`;
    this.client = new Valkey(config.fanoutValkeyUrl, { maxRetriesPerRequest: 1 });
  }

  /** Claims `id` until `until`; false when another redemption holds it. */
  async claim(id: string, until: Date): Promise<boolean> {
    const ttl = Math.max(1, until.getTime() - Date.now());
    const answer = await this.client.set(`${this.prefix}${id}`, "1", "PX", ttl, "NX");
    return answer === "OK";
  }
}
