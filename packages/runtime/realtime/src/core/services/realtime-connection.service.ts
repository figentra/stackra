/**
 * Stackra file contract:
 * Purpose: `RealtimeConnection`, the client's one realtime connection: started by the host's realtime context with the
 *          session's subscribe-token source after sign-in and stopped on sign-out, it opens a link through the
 *          selected `RealtimeTransport`, reconnects with capped, jittered backoff (the contracts `backoffDelay`: one
 *          second doubling, equal jitter, up to `maxBackoff`), suspends in the background and
 *          resumes on foreground when configured, and hands each refresh to the listeners of its event.
 * Boundary: a singleton service. It asks the token source before every attempt (tokens are one-time), and a source
 *           that answers `undefined` means signed out: the connection stops. Only the newest attempt's callbacks
 *           count, so a slow old link never flips the status. It never reconnects by itself while stopped or
 *           suspended. Listeners receive the data-free message; they refetch through their own queries.
 * Runtime: isomorphic
 * Governing contract: ADR 0225 (decision 1: reconnect); ADR 0295 (decision 10: the realtime context); ADR 0294
 *                     (decisions 16 and 17).
 */
import { Service } from "@stackra/container";
import { backoffDelay, Duration, Jitter } from "@stackra/contracts";
import type { TokenSource } from "@stackra/transport";

import type { RealtimeConfig } from "#config/realtime.config";
import type { RealtimeTransport } from "#contracts/ports/realtime-transport.port";
import type { RealtimeLink } from "#contracts/types/realtime-link.type";
import type { RealtimeMessage } from "#contracts/types/realtime-message.type";
import { RealtimeStatus } from "#core/enums/realtime-status.enum";
import type { RealtimeConnectionState } from "#core/types/realtime-connection-state.type";
import type { RealtimeEventRef } from "#core/types/realtime-event-ref.type";

/** The reconnect wait before stackra-223 moved the formula to @stackra/contracts: one second doubling, equal jitter. */
const RECONNECT = Object.freeze({ base: Duration.seconds(1), jitter: Jitter.Equal });

/**
 * The client realtime connection.
 *
 * @example
 * connection.start(() => session.realtimeToken()); // after sign-in
 * const stop = connection.subscribe(OrderPaid, () => orders.refetch());
 * connection.stop(); // on sign-out
 */
export class RealtimeConnection extends Service {
  /**
   * Calls `listener` whenever `state` changes; the shape `useSyncExternalStore` takes.
   *
   * @returns removes the listener.
   */
  readonly subscribeState = (listener: () => void): (() => void) => {
    this.stateListeners.add(listener);
    return () => {
      this.stateListeners.delete(listener);
    };
  };

  private readonly config: RealtimeConfig;

  private readonly transport: RealtimeTransport;

  private current: RealtimeConnectionState | null = null;

  private readonly stateListeners = new Set<() => void>();

  private readonly listeners = new Map<string, Set<(message: RealtimeMessage) => void>>();

  private tokens: TokenSource | undefined;

  private link: RealtimeLink | undefined;

  private attempt = 0;

  private generation = 0;

  private suspended = false;

  private retryTimer: ReturnType<typeof setTimeout> | undefined;

  private graceTimer: ReturnType<typeof setTimeout> | undefined;

  /**
   * @param config - the origin, the backoff cap and the background behaviour.
   * @param transport - the selected client driver.
   */
  constructor(config: RealtimeConfig, transport: RealtimeTransport) {
    super();
    this.config = config;
    this.transport = transport;
  }

  /** The connection's state, or `null` while stopped (signed out). Replaced, never mutated, on each change. */
  get state(): RealtimeConnectionState | null {
    return this.current;
  }

  /**
   * Calls `listener` with each refresh of `event` until the returned function is called.
   *
   * @returns removes the listener.
   */
  subscribe(event: RealtimeEventRef, listener: (message: RealtimeMessage) => void): () => void {
    const name = event.eventName;
    const set = this.listeners.get(name) ?? new Set();
    this.listeners.set(name, set);
    set.add(listener);
    return () => {
      set.delete(listener);
      if (set.size === 0) this.listeners.delete(name);
    };
  }

  /**
   * Connects with tokens from `tokens`, replacing any earlier start (a tenant switch restarts with the new source).
   *
   * @param tokens - answers a fresh subscribe token per attempt, or `undefined` when signed out.
   */
  start(tokens: TokenSource): void {
    this.stop();
    this.tokens = tokens;
    this.connect();
  }

  /** Closes the link and forgets the token source; `state` becomes `null`. */
  stop(): void {
    this.tokens = undefined;
    this.suspended = false;
    this.drop();
    clearTimeout(this.graceTimer);
    this.publish(null);
  }

  /** The app went to the background: with `reconnectOnForeground`, suspend after `backgroundGraceSeconds`. */
  background(): void {
    if (!this.config.reconnectOnForeground || this.tokens === undefined) return;
    clearTimeout(this.graceTimer);
    this.graceTimer = setTimeout(() => {
      this.suspended = true;
      this.drop();
      this.setStatus(RealtimeStatus.Disconnected);
    }, this.config.backgroundGraceSeconds * 1000);
  }

  /** The app is in the foreground again: cancel a pending suspension, or reconnect at once from one. */
  foreground(): void {
    clearTimeout(this.graceTimer);
    if (!this.suspended || this.tokens === undefined) return;
    this.suspended = false;
    this.attempt = 0;
    this.connect();
  }

  /** Hands `message` to the listeners of its event; a throwing listener is logged and never stops the others. */
  protected deliver(message: RealtimeMessage): void {
    for (const listener of this.listeners.get(message.name) ?? []) {
      try {
        listener(message);
      } catch (error) {
        // Report without breaking the delivery loop or the link.
        // oxlint-disable-next-line no-console -- reason: realtime has no logger dependency yet; a failing listener must not pass silently
        console.error(`A realtime listener of ${message.name} failed`, error);
      }
    }
  }

  /** Sets the status (a no-op when unchanged) and notifies; for a subclass that drives the status itself (a fake). */
  protected setStatus(status: RealtimeStatus): void {
    if (this.current?.status !== status) this.publish(Object.freeze({ status }));
  }

  /** Opens one link with a fresh token; only this generation's callbacks count. */
  private connect(): void {
    const ticket = ++this.generation;
    const tokens = this.tokens;
    if (tokens === undefined) return;
    this.setStatus(RealtimeStatus.Connecting);
    Promise.resolve()
      .then(tokens)
      .then(
        (token) => {
          if (ticket !== this.generation) return;
          if (token === undefined) return this.stop();
          this.link = this.transport.open(
            { origin: this.config.origin, token },
            {
              onOpen: () => {
                if (ticket !== this.generation) return;
                this.attempt = 0;
                this.setStatus(RealtimeStatus.Connected);
              },
              onMessage: (message) => {
                if (ticket === this.generation) this.deliver(message);
              },
              onClose: () => {
                if (ticket === this.generation) this.lost();
              },
            },
          );
        },
        () => {
          if (ticket === this.generation) this.lost();
        },
      )
      .catch(() => {
        // `open` threw (no origin, no socket support): treat it as a lost attempt.
        if (ticket === this.generation) this.lost();
      });
  }

  /** The link or the attempt failed: show it and retry after the backoff. */
  private lost(): void {
    this.link = undefined;
    this.setStatus(RealtimeStatus.Disconnected);
    clearTimeout(this.retryTimer);
    this.retryTimer = setTimeout(
      () => this.connect(),
      backoffDelay({ ...RECONNECT, max: this.config.maxBackoff }, ++this.attempt),
    );
  }

  /** Invalidates the current attempt, cancels a pending retry and closes the link. */
  private drop(): void {
    this.generation += 1;
    clearTimeout(this.retryTimer);
    this.link?.close();
    this.link = undefined;
  }

  /** Replaces the state and notifies every state listener. */
  private publish(state: RealtimeConnectionState | null): void {
    if (state === this.current) return;
    this.current = state;
    for (const listener of this.stateListeners) listener();
  }
}
