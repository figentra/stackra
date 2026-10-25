/**
 * Stackra file contract:
 * Purpose: the `valkey` driver of the `RealtimeFanout` port: every instance publishes to one Valkey pub/sub channel
 *          (`realtime.fanoutChannel`) and subscribes to it on a second connection, so a broadcast or a room frame
 *          published on any instance reaches the sessions and members of all of them.
 * Boundary: the server is the `REALTIME_VALKEY_URL` secret. Pub/sub is at most once: a message published while an
 *           instance reconnects is lost to it, which a data-free refresh and a CRDT update tolerate (the client
 *           refetches or resyncs on reconnect). Messages are JSON; one that does not parse is dropped. The subscribe
 *           connection opens on the first `subscribe` and closes when the last subscriber stops.
 * Runtime: node
 * Governing contract: ADR 0225 (decision 1: a native driver on Valkey pub/sub); ADR 0346 (decision 5); ADR 0150 (the
 *                     Valkey client); ADR 0173 (secrets by name).
 */
import { Driver } from "@stackra/container";
import Valkey from "iovalkey";

import { RealtimeConfig } from "#config/realtime.config";
import { RealtimeFanout } from "#contracts/ports/realtime-fanout.port";
import type { FanoutMessage } from "#contracts/types/fanout-message.type";

/**
 * Fans out through Valkey pub/sub.
 *
 * @example
 * // runway.yaml (production): config.realtime: { driver: websocket, fanout: valkey }
 * const stop = fanout.subscribe((message) => relay.deliver(message));
 */
export class ValkeyRealtimeFanoutDriver extends Driver(RealtimeFanout) {
  /** The publishing connection. */
  readonly client: Valkey;

  private readonly channel: string;

  private subscriber: Valkey | undefined;

  private readonly receivers = new Set<(message: FanoutMessage) => void>();

  /**
   * @param config - the server (`fanoutValkeyUrl`, the `REALTIME_VALKEY_URL` secret) and the channel.
   * @throws TypeError when the `REALTIME_VALKEY_URL` secret is not set.
   */
  constructor(config: RealtimeConfig) {
    super();
    if (config.fanoutValkeyUrl === "")
      throw new TypeError(
        "The valkey realtime fanout needs a server: set the REALTIME_VALKEY_URL secret",
      );
    this.channel = config.fanoutChannel;
    this.client = new Valkey(config.fanoutValkeyUrl, { maxRetriesPerRequest: 1 });
  }

  /** See `RealtimeFanout.publish`. */
  async publish(message: FanoutMessage): Promise<void> {
    await this.client.publish(this.channel, JSON.stringify(message));
  }

  /** See `RealtimeFanout.subscribe`. */
  subscribe(receive: (message: FanoutMessage) => void): () => void {
    this.receivers.add(receive);
    if (this.subscriber === undefined) {
      const subscriber = this.client.duplicate();
      this.subscriber = subscriber;
      subscriber.on("message", (channel: string, text: string) => {
        if (channel !== this.channel) return;
        let message: FanoutMessage;
        try {
          message = JSON.parse(text) as FanoutMessage;
        } catch {
          return;
        }
        for (const each of this.receivers)
          try {
            each(message);
          } catch {
            // One receiver must not stop the others.
          }
      });
      void subscriber.subscribe(this.channel).catch(() => undefined);
    }
    return () => {
      this.receivers.delete(receive);
      if (this.receivers.size > 0 || this.subscriber === undefined) return;
      const subscriber = this.subscriber;
      this.subscriber = undefined;
      subscriber.disconnect();
    };
  }
}
