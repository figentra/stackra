/**
 * Stackra file contract:
 * Purpose: `CollaborationSession`, the client's collaboration state: it joins rooms after reading the
 *          `LiveCollaborationEntitlement` grant for the room's scope, keeps each room's presence (status and other
 *          peers), throttles this client's cursor, and binds a document replica to the room's sync stream.
 * Boundary: a singleton service over the `PresenceChannel` and `SyncTransport` ports; it opens no network itself. A
 *           room is held while any caller holds it (each `join` and `bind` returns its own idempotent release) and is
 *           left with the last release. A refused grant is recorded in the room's state, never thrown to the caller,
 *           and a bound replica then stays local (no sync): editing and snapshots are not gated. On every stream open
 *           the replica's full state is sent, so a reconnect converges without an offline queue (no sync engine).
 * Runtime: isomorphic
 * Governing contract: ADR 0225 (decision 2: presence, cursors, Yjs co-editing); ADR 0270 (decisions 5 and 6); ADR 0202
 *                     (entitlement-gated free code); ADR 0227 (no sync engine); ADR 0294 (decisions 16 and 17).
 */
import { Service } from "@stackra/container";
import { EntitlementSource } from "@stackra/entitlements";
import { EntitlementRequiredError } from "@stackra/errors";
import { RealtimeStatus } from "@stackra/realtime";

import { CollaborationConfig } from "#config/collaboration.config";
import { PresenceChannel } from "#contracts/ports/presence-channel.port";
import { SyncTransport } from "#contracts/ports/sync-transport.port";
import type { CollaborationCursor } from "#contracts/types/collaboration-cursor.type";
import type { CollaborationRoom } from "#contracts/types/collaboration-room.type";
import type { DocumentReplica } from "#contracts/types/document-replica.type";
import type { PresenceLink } from "#contracts/types/presence-link.type";
import type { SyncLink } from "#contracts/types/sync-link.type";
import { LiveCollaborationEntitlement } from "#core/access/live-collaboration.entitlement";
import type { CollaborationRoomState } from "#core/types/collaboration-room-state.type";

/** One held room. */
interface Membership {
  readonly room: CollaborationRoom;
  /** Resolves `true` once the grant is read and the presence link opened, `false` when the room was refused. */
  readonly ready: Promise<boolean>;
  holds: number;
  state: CollaborationRoomState;
  link: PresenceLink | undefined;
  cursor: CollaborationCursor | null;
  pending: boolean;
  timer: ReturnType<typeof setTimeout> | undefined;
}

/**
 * The client collaboration session.
 *
 * @example
 * const leave = session.join(room);
 * session.state(room); // { status: "connected", peers: [...] }
 * session.moveCursor(room, { x: 120, y: 48 });
 * const unbind = session.bind(room, yjsReplica(doc));
 * unbind();
 * leave();
 */
export class CollaborationSession extends Service {
  private readonly config: CollaborationConfig;

  private readonly presence: PresenceChannel;

  private readonly sync: SyncTransport;

  private readonly entitlements: EntitlementSource;

  private readonly rooms = new Map<string, Membership>();

  private readonly listeners = new Set<() => void>();

  /**
   * @param config - the cursor send interval.
   * @param presence - the presence driver.
   * @param sync - the document stream driver.
   * @param entitlements - where the live collaboration grant comes from.
   */
  constructor(
    config: CollaborationConfig,
    presence: PresenceChannel,
    sync: SyncTransport,
    entitlements: EntitlementSource,
  ) {
    super();
    this.config = config;
    this.presence = presence;
    this.sync = sync;
    this.entitlements = entitlements;
  }

  /**
   * Calls `listener` whenever any room's state changes; the shape `useSyncExternalStore` takes.
   *
   * @returns removes the listener.
   */
  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  /** `room`'s state, or `null` while nobody holds it. Replaced, never mutated, on each change. */
  state(room: CollaborationRoom): CollaborationRoomState | null {
    return this.rooms.get(room.document)?.state ?? null;
  }

  /**
   * Holds `room`: the first holder reads the grant and joins its presence.
   *
   * @returns releases this hold (idempotent); the room is left when the last hold is released.
   */
  join(room: CollaborationRoom): () => void {
    return this.release(this.hold(room));
  }

  /** Shows this client's pointer at `cursor` (or hides it), at most once per `cursorIntervalMilliseconds`. */
  moveCursor(room: CollaborationRoom, cursor: CollaborationCursor | null): void {
    const membership = this.rooms.get(room.document);
    if (membership?.link === undefined) return;
    membership.cursor = cursor;
    this.sendCursor(membership);
  }

  /**
   * Holds `room` and, once its grant is read, streams `replica`'s local changes out and the other replicas' in. A
   * refused room leaves the replica local.
   *
   * @returns stops the stream and releases the hold (idempotent).
   */
  bind(room: CollaborationRoom, replica: DocumentReplica): () => void {
    const membership = this.hold(room);
    const release = this.release(membership);
    let bound = true;
    let link: SyncLink | undefined;
    let stopUpdates: (() => void) | undefined;
    void membership.ready.then((joined) => {
      if (!joined || !bound) return;
      const opened = this.sync.open(room, {
        onOpen: () => opened.send(replica.encode()),
        onUpdate: (update) => replica.apply(update),
        // The driver reconnects and calls onOpen again, which resends the full state.
        onClose: () => undefined,
      });
      link = opened;
      stopUpdates = replica.onUpdate((update) => opened.send(update));
    });
    return () => {
      if (!bound) return;
      bound = false;
      stopUpdates?.();
      link?.close();
      release();
    };
  }

  /** Adds one hold on `room`, opening its membership when nobody held it. */
  private hold(room: CollaborationRoom): Membership {
    const membership = this.rooms.get(room.document) ?? this.open(room);
    membership.holds += 1;
    return membership;
  }

  /** A one-shot release of one hold on `membership`. */
  private release(membership: Membership): () => void {
    let held = true;
    return () => {
      if (!held) return;
      held = false;
      membership.holds -= 1;
      if (membership.holds > 0 || this.rooms.get(membership.room.document) !== membership) return;
      this.rooms.delete(membership.room.document);
      clearTimeout(membership.timer);
      membership.link?.leave();
      this.notify();
    };
  }

  /** Records a new membership as connecting, reads the grant, then joins presence or records the refusal. */
  private open(room: CollaborationRoom): Membership {
    const membership: Membership = {
      room,
      holds: 0,
      state: Object.freeze({ status: RealtimeStatus.Connecting, peers: [] }),
      link: undefined,
      cursor: null,
      pending: false,
      timer: undefined,
      ready: this.authorize(room).then(
        () => this.connect(membership),
        (error: unknown) => {
          this.update(membership, { status: RealtimeStatus.Disconnected, peers: [], error });
          return false;
        },
      ),
    };
    this.rooms.set(room.document, membership);
    this.notify();
    return membership;
  }

  /**
   * Resolves when the plan grants live collaboration in `room`'s scope.
   *
   * @throws EntitlementRequiredError when the grant is absent or `false`.
   * @throws TypeError when the source answers a count for this feature (a source bug).
   */
  private async authorize(room: CollaborationRoom): Promise<void> {
    const grant = await this.entitlements.grant(LiveCollaborationEntitlement, room.scope?.id);
    if (grant === true) return;
    if (grant === undefined || grant === false) throw EntitlementRequiredError.create();
    throw new TypeError(
      `LiveCollaborationEntitlement is a feature, so its source answers a boolean, not ${grant}`,
    );
  }

  /** Joins `membership`'s presence unless it was released meanwhile. */
  private connect(membership: Membership): boolean {
    if (this.rooms.get(membership.room.document) !== membership) return false;
    membership.link = this.presence.join(membership.room, {
      onOpen: () =>
        this.update(membership, {
          status: RealtimeStatus.Connected,
          peers: membership.state.peers,
        }),
      onPeers: (peers) => this.update(membership, { status: membership.state.status, peers }),
      onClose: () => this.update(membership, { status: RealtimeStatus.Disconnected, peers: [] }),
    });
    return true;
  }

  /** Replaces `membership`'s state and notifies, unless it was released. */
  private update(membership: Membership, state: CollaborationRoomState): void {
    if (this.rooms.get(membership.room.document) !== membership) return;
    membership.state = Object.freeze(state);
    this.notify();
  }

  /** Sends the latest cursor now, or once the interval since the last send has passed. */
  private sendCursor(membership: Membership): void {
    if (membership.timer !== undefined) {
      membership.pending = true;
      return;
    }
    membership.link?.move(membership.cursor);
    membership.timer = setTimeout(() => {
      membership.timer = undefined;
      if (!membership.pending) return;
      membership.pending = false;
      this.sendCursor(membership);
    }, this.config.cursorIntervalMilliseconds);
  }

  /** Notifies every state listener. */
  private notify(): void {
    for (const listener of this.listeners) listener();
  }
}
