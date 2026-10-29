/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./node` entry: the flush writer, the relay, the inbox, the in-process
 *          publisher and the two Postgres drivers are its values, and nothing else is.
 * Boundary: test only; imports the stand-in barrel through its `#node` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";

import * as node from "#node/index";

describe("@stackra/outbox/node", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(node).sort()).toEqual([
      "ChangeFeedService",
      "InboxEventPublisherDriver",
      "InboxService",
      "OutboxRelayService",
      "OutboxWriterService",
      "PostgresChangeFeedDriver",
      "PostgresDeviceSequenceStoreDriver",
      "PostgresInboxDriver",
      "PostgresOfflineCapStoreDriver",
      "PostgresOutboxDriver",
      "PostgresReplicaLogDriver",
    ]);
  });
});
