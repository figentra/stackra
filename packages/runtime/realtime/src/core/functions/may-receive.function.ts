/**
 * Stackra file contract:
 * Purpose: `mayReceive(session, broadcast, realms)`, the delivery check of every broadcast: the session holds the
 *          permission, and the channel is its own principal's or its own tenant's with its realm allowed.
 * Boundary: a pure function the hub runs per session; deny by default, so a channel of any other shape reaches nobody.
 *           `realms` gates tenant channels only: a principal always hears its own channel.
 * Runtime: isomorphic
 * Governing contract: ADR 0225 (decision 1: IAM authorises each channel; notes of 0294 and 2026-10-23).
 */
import type { Realm } from "@stackra/contracts";

import type { RealtimeBroadcast } from "#contracts/types/realtime-broadcast.type";
import type { RealtimeSession } from "#contracts/types/realtime-session.type";

/**
 * Whether `session` may receive `broadcast`.
 *
 * @param realms - the realms allowed on tenant channels (`RealtimeConfig.channelRealms`).
 * @example
 * mayReceive(session, { permission: "orders.order.read", message }, [Realm.Staff]);
 */
export function mayReceive(
  session: RealtimeSession,
  broadcast: RealtimeBroadcast,
  realms: readonly Realm[],
): boolean {
  if (!session.permissions.includes(broadcast.permission)) return false;
  const [scope, id, module, ...rest] = broadcast.message.channel.split(".");
  if (module === undefined || rest.length > 0) return false;
  if (scope === "principal") return id === session.principalId;
  if (scope === "tenant")
    return (
      session.scopeId !== undefined &&
      id === session.scopeId &&
      session.realm !== undefined &&
      realms.includes(session.realm)
    );
  return false;
}
