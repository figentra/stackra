/**
 * Stackra file contract:
 * Purpose: `storefrontEdge(args)`, a storefront's campaign edge on one zone: per campaign with a waiting room, the
 *          Cloudflare waiting room on its host and path (active and new shoppers, session length) and the event that
 *          opens it for the campaign window, both suspended while the campaign's room is off; and the per-shopper limit
 *          rules of its hot items, for `zoneEdge` to add to the zone's rate-limit entry point.
 * Boundary: declares Pulumi resources only. Every threshold is the tenant's campaign setting (`parseStorefront`); the
 *           toggle is `waitingRoom.enabled`, so turning a room off or on is a settings change, not a code change.
 *           Waiting rooms need a plan that includes them (an owner step).
 * Runtime: node (Pulumi program)
 * Governing contract: ADR 0402 (storefront waiting room and per-shopper limits), ADR 0217 (decision 2).
 */
import * as cloudflare from "@pulumi/cloudflare";
import type * as pulumi from "@pulumi/pulumi";

import { shopperLimitRules } from "#core/functions/shopper-limit-rules.function";
import type { StorefrontPolicy } from "#core/types/storefront-policy.type";

/** Milliseconds in a minute. */
const MINUTE = 60_000;

/**
 * The storefront resources of the zone `name`.
 *
 * @param args - the zone name and id and the parsed storefront policy.
 * @example
 * const storefront = storefrontEdge({ name: "acme.example", zoneId: zone.id, policy: parseStorefront(settings) });
 * zoneEdge({ name: "acme.example", zoneId: zone.id, plan: "pro", edge, shopperRules: storefront.rules });
 */
export function storefrontEdge(args: {
  readonly name: string;
  readonly zoneId: pulumi.Input<string>;
  readonly policy: StorefrontPolicy;
}) {
  const { name, zoneId, policy } = args;
  const rooms = Object.entries(policy.campaigns).flatMap(([key, campaign]) => {
    const room = campaign.waitingRoom;
    if (room === undefined) return [];
    const suspended = !room.enabled;
    const waitingRoom = new cloudflare.WaitingRoom(`${name}-${key}`, {
      zoneId,
      name: key,
      host: campaign.host,
      path: campaign.path,
      totalActiveUsers: room.totalActiveUsers,
      newUsersPerMinute: room.newUsersPerMinute,
      ...(room.sessionMinutes !== undefined && { sessionDuration: room.sessionMinutes }),
      queueAll: false,
      suspended,
      description: `Waiting room of the ${key} campaign`,
    });
    const event = new cloudflare.WaitingRoomEvent(`${name}-${key}`, {
      zoneId,
      waitingRoomId: waitingRoom.id,
      name: key,
      eventStartTime: new Date(room.startsAt).toISOString(),
      eventEndTime: new Date(room.endsAt).toISOString(),
      ...(room.prequeueMinutes !== undefined && {
        prequeueStartTime: new Date(
          Date.parse(room.startsAt) - room.prequeueMinutes * MINUTE,
        ).toISOString(),
      }),
      suspended,
    });
    return [[key, { waitingRoom, event }] as const];
  });
  return { rooms: Object.fromEntries(rooms), rules: shopperLimitRules(policy) };
}
