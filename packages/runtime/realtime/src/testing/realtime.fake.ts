/**
 * Stackra file contract:
 * Purpose: `RealtimeFake`, the test double of `RealtimeConnection`: a connection that starts signed in and live (or
 *          at the status a test asks for), on which a test emits a consumed event (`fake.emit(OrderPaid, {...})`) and
 *          moves the status (`fake.setStatus(RealtimeStatus.Disconnected)`), bound in place of `RealtimeConnection`.
 * Boundary: a real `RealtimeConnection` (so `instanceof` holds and the hooks read it unchanged) over the default
 *           configuration and the memory transport, so a `start` in the code under test opens no network. `emit`
 *           delivers the data-free message the real broadcast would: the payload argument is accepted so a test reads
 *           like the producer's event, and dropped, exactly as the server drops it. `stop()` makes it signed out.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3: domain fakes in the owning package's `./testing`); ADR 0225 (data-free
 *                     refresh); ADR 0266 (decision 2: a fake per capability).
 */
import {
  MemoryRealtimeTransportDriver,
  RealtimeConfig,
  RealtimeConnection,
  RealtimeStatus,
} from "#core/index";
import type { RealtimeEventRef } from "#core/index";

/**
 * A realtime connection a test drives.
 *
 * @example
 * const realtime = new RealtimeFake();
 * realtime.emit(OrderPaid, { orderId });
 */
export class RealtimeFake extends RealtimeConnection {
  private emitted = 0;

  /** @param status - the starting status; live by default. */
  constructor(status: RealtimeStatus = RealtimeStatus.Connected) {
    super(new RealtimeConfig(), new MemoryRealtimeTransportDriver());
    this.setStatus(status);
  }

  /**
   * Delivers a refresh of `event` to its subscribers now, as the realtime connection would.
   *
   * @param _payload - the event's fields, for a test that reads like the producer; never delivered.
   */
  emit<P>(event: RealtimeEventRef<P>, _payload?: Partial<P>): void {
    this.emitted += 1;
    this.deliver({ channel: "test", name: event.eventName, id: `evt_fake_${this.emitted}` });
  }

  /** Moves the connection to `status`, as a lost or regained link would. */
  override setStatus(status: RealtimeStatus): void {
    super.setStatus(status);
  }
}
