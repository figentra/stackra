/**
 * Stackra file contract:
 * Purpose: the client driver of the `RoomTokens` port (driver name `client`): `issue` calls the hosting service's
 *          `collaboration.room.token` action and `publish` its `collaboration.room.publish` action, through the app's
 *          `DynamicClient`, so a browser or native host binds rooms with no hand-written driver.
 * Boundary: the routes are the ones gen derives for the two keys (`POST /rooms/token`, `POST /rooms/publish`); the
 *           base URL is the clients config's, `producers.collaboration` when the hosting service is not behind the one
 *           API URL. The answer of `issue` is checked to be a `RealtimeTarget` before it is used. A refusal rejects, and
 *           `openRoom` retries it like a dropped link. The room's scope path travels as the call's scope.
 * Runtime: isomorphic
 * Governing contract: ADR 0346 (decisions 3 and 5); ADR 0260 (decision 6 and the 2026-10-26 note: dynamic keys).
 */
import type { DynamicClient } from "@stackra/clients";
import { Driver } from "@stackra/container";
import { HttpMethod, type Json } from "@stackra/contracts";
import type { RealtimeTarget, RoomPublish } from "@stackra/realtime/contracts";

import { RoomTokens } from "#contracts/ports/room-tokens.port";
import type { CollaborationRoom } from "#contracts/types/collaboration-room.type";

/** The room-token action. */
const TOKEN = Object.freeze({
  key: "collaboration.room.token@1",
  kind: "action" as const,
  endpoint: { method: HttpMethod.Post, path: "/rooms/token" },
});

/** The stream member's publish action. */
const PUBLISH = Object.freeze({
  key: "collaboration.room.publish@1",
  kind: "action" as const,
  endpoint: { method: HttpMethod.Post, path: "/rooms/publish" },
});

/**
 * Issues room tokens through the hosting service.
 *
 * @example
 * // generated wiring: { port: RoomTokens, candidates: { client: … }, deps: { client: [DynamicClient] } }
 * const target = await tokens.issue({ document: template.id, scope });
 */
export class ClientRoomTokensDriver extends Driver(RoomTokens) {
  /** Calls the hosting service by key and route. */
  private readonly client: DynamicClient;

  /**
   * @param client - the app's dynamic service client.
   */
  constructor(client: DynamicClient) {
    super();
    this.client = client;
  }

  /**
   * A fresh token for `room` (`RoomTokens.issue`).
   *
   * @throws TypeError when the answer is not a `RealtimeTarget`; the action's refusal otherwise.
   */
  async issue(room: CollaborationRoom): Promise<RealtimeTarget> {
    const answer = (await this.client.call(
      TOKEN,
      { document: room.document },
      room.scope === undefined ? undefined : { scope: room.scope.path },
    )) as Partial<RealtimeTarget> | null;
    if (typeof answer?.origin !== "string" || typeof answer.token !== "string")
      throw new TypeError("collaboration.room.token answered no origin and token");
    return { origin: answer.origin, token: answer.token };
  }

  /** Publishes as the member whose welcome carried `key` (`RoomTokens.publish`). */
  override async publish(
    room: CollaborationRoom,
    key: string,
    message: RoomPublish,
  ): Promise<void> {
    await this.client.call(
      PUBLISH,
      { key, t: message.t, data: (message.data ?? null) as Json },
      room.scope === undefined ? undefined : { scope: room.scope.path },
    );
  }
}
