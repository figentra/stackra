/**
 * Stackra file contract:
 * Purpose: `RealtimeRooms`, the server's room hub (ADR 0346): it issues one-time room tokens for grants the
 *          authenticated endpoint checked, joins each member under its grant until the token expires (over a socket, or
 *          over a server-sent-events stream when the socket is blocked), relays each message to the room's other
 *          members (on this instance directly, on the others through the `RealtimeFanout`), stamps every sender, takes
 *          a stream member's messages from the `collaboration.room.publish` action by its publish key (on whichever
 *          instance holds it), and enforces the caps: members per room (counted over every instance by default),
 *          message size, messages per second and idle.
 * Boundary: a singleton service. It never reads a request or a permission: the endpoint resolves the grant (view
 *           permission at the document's scope, visibility, the live-collaboration entitlement, and `mayEdit` from the
 *           edit permission). A room is keyed by the session's tenant and the document, so it never spans tenants. A
 *           viewer's `update` is refused `forbidden` and the member stays; a member over a cap is dropped with
 *           `room_limit_reached`. Payloads are relayed, never stored or read. The cross-instance member count is
 *           eventually consistent: each instance announces its count on a join and stamps it on every relayed frame, and
 *           a count not refreshed for two idle periods is dropped (its members were idle-closed or its instance died).
 *           A publish key works only for the member's own principal.
 * Runtime: isomorphic
 * Governing contract: ADR 0346 (decisions 1 and 3 to 6); ADR 0225 (decision 1); ADR 0294 (decisions 16 and 17).
 */
import { Service } from "@stackra/container";
import { Duration } from "@stackra/contracts";
import { ForbiddenError, isRefusal } from "@stackra/errors";

import type { RealtimeConfig } from "#config/realtime.config";
import type { RealtimeFanout } from "#contracts/ports/realtime-fanout.port";
import type { FanoutMessage } from "#contracts/types/fanout-message.type";
import type { RoomFrame } from "#contracts/types/room-frame.type";
import type { RoomGrant } from "#contracts/types/room-grant.type";
import type { RoomPeerRef } from "#contracts/types/room-peer-ref.type";
import type { RoomPublish } from "#contracts/types/room-publish.type";
import { RoomLimitReachedError } from "#core/errors/room-limit-reached.error";
import type { RealtimeToken } from "#core/types/realtime-token.type";
import type { RoomMember } from "#core/types/room-member.type";
import type { RoomPeer } from "#core/types/room-peer.type";
import type { RoomSocket } from "#core/types/room-socket.type";

/** Close code: the room token was unknown, used or expired. */
const UNAUTHORISED = 4401;

/** Close code: the token's lifetime ended; rejoin with a new one. */
const TOKEN_EXPIRED = 4001;

/** Close code: the member sent nothing for the idle time. */
const IDLE = 4408;

/** Close code: a cap was reached. */
const LIMIT = 4429;

/** How often a comment line keeps an idle room stream alive, under the usual 30 to 60 second proxy timeouts. */
const HEARTBEAT_MS = 25_000;

/** The headers of an event stream. */
const STREAM_HEADERS = {
  "content-type": "text/event-stream; charset=utf-8",
  "cache-control": "no-store",
  "x-accel-buffering": "no",
};

/** The kinds a member may publish. */
const KINDS: ReadonlySet<string> = new Set(["presence", "awareness", "update"]);

/** A token waiting to be redeemed. */
interface Pending {
  readonly grant: RoomGrant;
  readonly expiresAt: number;
}

/** A joined member and its counters. */
interface Entry {
  readonly self: RoomPeerRef;
  readonly room: string;
  readonly key: string;
  readonly peer: RoomPeer;
  readonly mayEdit: boolean;
  windowStart: number;
  sent: number;
  idle: ReturnType<typeof setTimeout> | undefined;
  leave: () => void;
}

/** Whether `value` is a well-formed member message. */
function isPublish(value: unknown): value is RoomPublish {
  return (
    typeof value === "object" &&
    value !== null &&
    KINDS.has((value as { t?: unknown }).t as string) &&
    "data" in value
  );
}

/**
 * Holds the rooms of this instance.
 *
 * @example
 * const { token } = rooms.issueToken({ session, document: page.id, mayEdit }); // in the room-token endpoint
 * rooms.accept(socket, request.url); // in the generated raw endpoint of the room path
 */
export class RealtimeRooms extends Service {
  /** This instance's id: room frames it relayed come back through the fanout under it and are skipped. */
  readonly instance: string = crypto.randomUUID();

  private readonly config: RealtimeConfig;

  private readonly fanout: RealtimeFanout;

  private readonly pending = new Map<string, Pending>();

  private readonly rooms = new Map<string, Set<Entry>>();

  /** This instance's members by publish key. */
  private readonly keys = new Map<string, Entry>();

  /** The other instances' member counts: room to instance to its count and when it arrived. */
  private readonly remote = new Map<string, Map<string, { members: number; at: number }>>();

  /**
   * @param config - the token lifetime and the room caps.
   * @param fanout - carries frames to this service's other instances.
   */
  constructor(config: RealtimeConfig, fanout: RealtimeFanout) {
    super();
    this.config = config;
    this.fanout = fanout;
  }

  /** How many members room `<tenant>:<document>` holds on this instance. */
  size(room: string): number {
    return this.rooms.get(room)?.size ?? 0;
  }

  /**
   * Issues a one-time room token for `grant`, valid for `subscribeTokenTtl`.
   *
   * @param grant - built by the server after its checks, never from the client.
   */
  issueToken(grant: RoomGrant): RealtimeToken {
    const now = Date.now();
    for (const [token, entry] of this.pending)
      if (entry.expiresAt <= now) this.pending.delete(token);
    const token = crypto.randomUUID();
    const expiresAt = now + Duration.toMilliseconds(this.config.subscribeTokenTtl);
    this.pending.set(token, { grant, expiresAt });
    return { token, expiresAt: new Date(expiresAt) };
  }

  /**
   * Redeems `token` and joins `peer` to its room until the token expires; sends it `welcome` with its stamped identity.
   *
   * @returns the membership; `undefined` when the token is unknown, already used or expired.
   * @throws RoomLimitReachedError when the room is full.
   */
  join(token: string, peer: RoomPeer): RoomMember | undefined {
    const found = this.pending.get(token);
    this.pending.delete(token);
    const remaining = found === undefined ? 0 : found.expiresAt - Date.now();
    if (found === undefined || remaining <= 0) return undefined;
    const { grant } = found;
    const room = `${grant.session.scopeId ?? "platform"}:${grant.document}`;
    const members = this.rooms.get(room) ?? new Set<Entry>();
    if (members.size + this.remoteMembers(room) >= this.config.rooms.maxMembers)
      throw RoomLimitReachedError.create();
    this.rooms.set(room, members);
    const self: RoomPeerRef = Object.freeze({
      peerId: crypto.randomUUID(),
      principalId: grant.session.principalId,
    });
    const expiry = setTimeout(() => this.drop(entry, TOKEN_EXPIRED, "token_expired"), remaining);
    let left = false;
    const key = crypto.randomUUID();
    const entry: Entry = {
      self,
      room,
      key,
      peer,
      mayEdit: grant.mayEdit,
      windowStart: Date.now(),
      sent: 0,
      idle: undefined,
      leave: () => {
        if (left) return;
        left = true;
        clearTimeout(expiry);
        clearTimeout(entry.idle);
        members.delete(entry);
        this.keys.delete(key);
        if (members.size === 0) this.rooms.delete(room);
        this.relay(room, { t: "left", peer: self }, undefined);
      },
    };
    members.add(entry);
    this.keys.set(key, entry);
    this.touch(entry);
    peer.deliver({ t: "welcome", self, key });
    this.fanout
      .publish({ kind: "room-members", room, origin: this.instance, members: members.size })
      .catch(() => undefined);
    return {
      self,
      publish: (message) => this.publish(room, entry, message),
      leave: () => entry.leave(),
    };
  }

  /**
   * Joins `socket` with the room token in `url`, or closes it: `4401` for a bad token, `4429` for a full room. Each
   * frame the member sends is relayed; a viewer's update is answered `refused`, a member over a cap is dropped.
   *
   * @param url - the upgrade request's URL, absolute or path-relative.
   * @returns whether the socket was joined.
   */
  accept(socket: RoomSocket, url: string): boolean {
    const token = new URL(url, "http://realtime.invalid").searchParams.get("token") ?? "";
    let member: RoomMember | undefined;
    try {
      member = this.join(token, {
        deliver: (frame) => socket.send(JSON.stringify(frame)),
        close: (code, reason) => socket.close(code, reason),
      });
    } catch (error) {
      if (!isRefusal(error, RoomLimitReachedError)) throw error;
      socket.close(LIMIT, "room_limit_reached");
      return false;
    }
    if (member === undefined) {
      socket.close(UNAUTHORISED, "unauthorised");
      return false;
    }
    const joined = member;
    socket.addEventListener("message", (event) => {
      if (typeof event.data !== "string") return;
      let message: unknown;
      try {
        message = JSON.parse(event.data);
      } catch {
        return;
      }
      if (!isPublish(message)) return;
      try {
        joined.publish(message);
      } catch (error) {
        if (isRefusal(error, ForbiddenError))
          socket.send(JSON.stringify({ t: "refused", code: error.code }));
        else if (!isRefusal(error, RoomLimitReachedError)) throw error;
      }
    });
    socket.addEventListener("close", () => joined.leave());
    return true;
  }

  /**
   * Answers a GET of the room path with a `text/event-stream` of the member's frames (`event: frame`), the fallback
   * when a socket cannot open. The member publishes through `collaboration.room.publish` with the `key` of its
   * welcome. A dropped member gets `event: close` with the code and reason before the stream ends.
   *
   * @returns 200 with the stream; 426 for a WebSocket upgrade (the token is left unused); 401 for a bad token; 429 for
   *          a full room.
   */
  stream(request: Request): Response {
    if (request.headers.get("upgrade")?.toLowerCase() === "websocket")
      return new Response(null, { status: 426 });
    const token = new URL(request.url).searchParams.get("token") ?? "";
    const encoder = new TextEncoder();
    let controller: ReadableStreamDefaultController<Uint8Array> | undefined;
    // oxlint-disable-next-line prefer-const -- reason: read by the close handler created before it is set; const would put it in the TDZ
    let heartbeat: ReturnType<typeof setInterval> | undefined;
    let closed = false;
    const send = (text: string): void => {
      if (!closed) controller?.enqueue(encoder.encode(text));
    };
    const end = (): void => {
      if (closed) return;
      closed = true;
      clearInterval(heartbeat);
      controller?.close();
    };
    let member: RoomMember | undefined;
    // `start` runs synchronously in the constructor, so the controller exists before the welcome is delivered.
    const body = new ReadableStream<Uint8Array>({
      start: (streamController) => {
        controller = streamController;
      },
      cancel: () => {
        closed = true;
        clearInterval(heartbeat);
        member?.leave();
      },
    });
    try {
      member = this.join(token, {
        deliver: (frame) => send(`event: frame\ndata: ${JSON.stringify(frame)}\n\n`),
        close: (code, reason) => {
          send(`event: close\ndata: ${JSON.stringify({ code, reason })}\n\n`);
          end();
        },
      });
    } catch (error) {
      if (!isRefusal(error, RoomLimitReachedError)) throw error;
      void body.cancel();
      return new Response(null, { status: 429 });
    }
    if (member === undefined) {
      void body.cancel();
      return new Response(null, { status: 401 });
    }
    heartbeat = setInterval(() => send(": ping\n\n"), HEARTBEAT_MS);
    return new Response(body, { status: 200, headers: STREAM_HEADERS });
  }

  /**
   * Relays `message` from the member whose welcome carried `key`, for the `collaboration.room.publish` action. A member
   * on this instance publishes at once and a refusal is thrown to the caller; one on another instance is reached
   * through the fanout, where a refusal is sent to the member as a `refused` frame.
   *
   * @param principalId - the action's verified caller; it must be the member's principal.
   * @throws ForbiddenError when the member is here and belongs to another principal, or is a viewer sending an
   *         update; RoomLimitReachedError over the size or rate cap (the member is dropped).
   */
  async publishFrom(key: string, principalId: string, message: RoomPublish): Promise<void> {
    const entry = this.keys.get(key);
    if (entry === undefined) {
      await this.fanout.publish({ kind: "room-publish", key, principalId, message });
      return;
    }
    if (entry.self.principalId !== principalId) throw ForbiddenError.create();
    this.publish(entry.room, entry, message);
  }

  /** Takes what another instance fanned out: a room frame for this instance's members, a member count, or a publish. */
  receive(message: FanoutMessage): void {
    if (message.kind === "room-publish") {
      const entry = this.keys.get(message.key);
      if (entry === undefined || entry.self.principalId !== message.principalId) return;
      try {
        this.publish(entry.room, entry, message.message);
      } catch (error) {
        if (isRefusal(error, ForbiddenError))
          entry.peer.deliver({ t: "refused", code: error.code });
        else if (!isRefusal(error, RoomLimitReachedError)) throw error;
      }
      return;
    }
    if (message.kind === "broadcast" || message.origin === this.instance) return;
    if (message.members !== undefined) this.count(message.room, message.origin, message.members);
    if (message.kind === "room") this.deliver(message.room, message.frame, undefined);
  }

  /** Records `origin`'s member count of `room`; a count of 0 is forgotten. */
  private count(room: string, origin: string, members: number): void {
    const counts = this.remote.get(room) ?? new Map<string, { members: number; at: number }>();
    if (members > 0) counts.set(origin, { members, at: Date.now() });
    else counts.delete(origin);
    if (counts.size === 0) this.remote.delete(room);
    else this.remote.set(room, counts);
  }

  /** The members of `room` on the other instances, from counts fresher than two idle periods; 0 when not counted. */
  private remoteMembers(room: string): number {
    if (!this.config.rooms.countAcrossInstances) return 0;
    const since = Date.now() - this.config.rooms.idleCloseSeconds * 2000;
    let total = 0;
    for (const { members, at } of this.remote.get(room)?.values() ?? [])
      if (at >= since) total += members;
    return total;
  }

  /** Checks the caps and the grant, then relays `message` from `entry`. */
  private publish(room: string, entry: Entry, message: RoomPublish): void {
    const { maxMessageBytes, maxMessagesPerSecond } = this.config.rooms;
    const size = new TextEncoder().encode(JSON.stringify(message.data ?? null)).length;
    const now = Date.now();
    if (now - entry.windowStart >= 1000) {
      entry.windowStart = now;
      entry.sent = 0;
    }
    entry.sent += 1;
    if (size > maxMessageBytes || entry.sent > maxMessagesPerSecond) {
      this.drop(entry, LIMIT, "room_limit_reached");
      throw RoomLimitReachedError.create();
    }
    if (message.t === "update" && !entry.mayEdit) throw ForbiddenError.create();
    this.touch(entry);
    this.relay(room, { t: message.t, from: entry.self, data: message.data }, entry);
  }

  /** Delivers `frame` here and hands it to the other instances. */
  private relay(room: string, frame: RoomFrame, sender: Entry | undefined): void {
    this.deliver(room, frame, sender);
    this.fanout
      .publish({ kind: "room", room, frame, origin: this.instance, members: this.size(room) })
      .catch(() => undefined);
  }

  /** Delivers `frame` to this instance's members of `room` but `sender`; a member whose delivery throws leaves. */
  private deliver(room: string, frame: RoomFrame, sender: Entry | undefined): void {
    // A Set skips the entries deleted while it is iterated, so a member that leaves here is safe.
    for (const entry of this.rooms.get(room) ?? []) {
      if (entry === sender) continue;
      try {
        entry.peer.deliver(frame);
      } catch {
        entry.leave();
      }
    }
  }

  /** Restarts `entry`'s idle timer. */
  private touch(entry: Entry): void {
    clearTimeout(entry.idle);
    entry.idle = setTimeout(
      () => this.drop(entry, IDLE, "idle"),
      this.config.rooms.idleCloseSeconds * 1000,
    );
  }

  /** Removes `entry` and closes its connection with `code`. */
  private drop(entry: Entry, code: number, reason: string): void {
    entry.leave();
    try {
      entry.peer.close(code, reason);
    } catch {
      // The connection is already gone.
    }
  }
}
