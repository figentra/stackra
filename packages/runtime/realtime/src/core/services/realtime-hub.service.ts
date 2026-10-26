/**
 * Stackra file contract:
 * Purpose: `RealtimeHub`, the server's channel hub: it issues one-time subscribe tokens for verified sessions, joins
 *          each connection a driver accepts under its session until the token expires, and delivers every broadcast
 *          to the connections whose session may receive it.
 * Boundary: a singleton service the three server drivers share. It never reads a request: the authenticated endpoint
 *           builds the session from the typed actor and calls `issueToken`. A token is redeemed once; a connection is
 *           closed at the token's expiry so permissions are re-read each `subscribeTokenTtl`. A peer whose delivery
 *           throws is dropped, never the broadcast.
 * Runtime: isomorphic
 * Governing contract: ADR 0225 (decision 1: authenticated channels, IAM authorises each channel; notes of 0294 and
 *                     2026-10-23); ADR 0294 (decisions 16 and 17).
 */
import { Service } from "@stackra/container";
import { Duration } from "@stackra/contracts";

import type { RealtimeConfig } from "#config/realtime.config";
import type { RealtimeBroadcast } from "#contracts/types/realtime-broadcast.type";
import type { RealtimeSession } from "#contracts/types/realtime-session.type";
import { mayReceive } from "#core/functions/may-receive.function";
import type { RealtimePeer } from "#core/types/realtime-peer.type";
import type { RealtimeToken } from "#core/types/realtime-token.type";

/** A token waiting to be redeemed. */
interface Grant {
  readonly session: RealtimeSession;
  readonly expiresAt: number;
}

/** A joined connection. */
interface Member {
  readonly session: RealtimeSession;
  readonly peer: RealtimePeer;
  readonly leave: () => void;
}

/**
 * Holds the live connections of this process and fans broadcasts out to them.
 *
 * @example
 * const { token } = hub.issueToken({ principalId, tenantId, realm, permissions }); // in the token endpoint
 * const leave = hub.join(token, { deliver: (message) => socket.send(JSON.stringify(message)), close: () => socket.close() });
 */
export class RealtimeHub extends Service {
  private readonly config: RealtimeConfig;

  // shortcut: tokens and connections live in this process, so the token request and the connect must reach the same
  // instance and a broadcast reaches only this instance's sessions; add a shared pub/sub driver (ADR 0225 decision 1:
  // Valkey or Postgres) when a service runs more than one instance.
  private readonly grants = new Map<string, Grant>();

  private readonly members = new Set<Member>();

  /**
   * @param config - the realms allowed on tenant channels and the token lifetime.
   */
  constructor(config: RealtimeConfig) {
    super();
    this.config = config;
  }

  /** How many connections are joined. */
  get size(): number {
    return this.members.size;
  }

  /**
   * Issues a one-time subscribe token for `session`, valid for `subscribeTokenTtl`.
   *
   * @param session - built by the server from the verified actor, never from the client.
   */
  issueToken(session: RealtimeSession): RealtimeToken {
    const now = Date.now();
    for (const [token, grant] of this.grants) if (grant.expiresAt <= now) this.grants.delete(token);
    const token = crypto.randomUUID();
    const expiresAt = now + Duration.toMilliseconds(this.config.subscribeTokenTtl);
    this.grants.set(token, { session, expiresAt });
    return { token, expiresAt: new Date(expiresAt) };
  }

  /**
   * Redeems `token` and joins `peer` under its session until the token expires, when the peer is closed.
   *
   * @returns leaves the hub (idempotent); `undefined` when the token is unknown, already used or expired.
   */
  join(token: string, peer: RealtimePeer): (() => void) | undefined {
    const grant = this.grants.get(token);
    this.grants.delete(token);
    const remaining = grant === undefined ? 0 : grant.expiresAt - Date.now();
    if (grant === undefined || remaining <= 0) return undefined;
    const expiry = setTimeout(() => {
      member.leave();
      peer.close();
    }, remaining);
    const member: Member = {
      session: grant.session,
      peer,
      leave: () => {
        clearTimeout(expiry);
        this.members.delete(member);
      },
    };
    this.members.add(member);
    return member.leave;
  }

  /**
   * Delivers `broadcast` to every joined connection whose session may receive it.
   *
   * @returns how many connections it reached.
   */
  publish(broadcast: RealtimeBroadcast): number {
    let reached = 0;
    for (const member of this.members) {
      if (!mayReceive(member.session, broadcast, this.config.channelRealms)) continue;
      try {
        member.peer.deliver(broadcast.message);
        reached += 1;
      } catch {
        // A dead connection must not stop the fan-out; it leaves and its client reconnects.
        member.leave();
      }
    }
    return reached;
  }
}
