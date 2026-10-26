/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./contracts` entry: the three ports are its only values, and the types they
 *          speak resolve with public ids, a `ScopeRef` and opaque `Uint8Array` updates.
 * Boundary: test only; imports the stand-in barrel through its `#contracts` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15).
 */
import type { PublicId, ScopeRef } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as contracts from "#contracts/index";
import type {
  CollaborationCursor,
  CollaborationRoom,
  CommentableRef,
  CommentRules,
  CommentView,
  DocumentReplica,
  DocumentSnapshot,
  MentionTarget,
  PresenceLink,
  PresenceLinkHandlers,
  PresencePeer,
  SyncLink,
  SyncLinkHandlers,
} from "#contracts/index";

describe("@stackra/collaboration/contracts", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(contracts).sort()).toEqual([
      "CommentVisibility",
      "MentionDirectory",
      "MentionKind",
      "PresenceChannel",
      "RoomTokens",
      "SnapshotStore",
      "SyncTransport",
      "ThreadStatus",
    ]);
  });

  it("resolves its public types", () => {
    expectTypeOf<CollaborationRoom>().toEqualTypeOf<{
      readonly document: PublicId;
      readonly scope?: ScopeRef;
    }>();
    expectTypeOf<CollaborationCursor>().toEqualTypeOf<{ readonly x: number; readonly y: number }>();
    expectTypeOf<PresencePeer["cursor"]>().toEqualTypeOf<CollaborationCursor | null>();
    expectTypeOf<PresencePeer["principalId"]>().toEqualTypeOf<PublicId>();
    expectTypeOf<PresenceLink["move"]>().parameter(0).toEqualTypeOf<CollaborationCursor | null>();
    expectTypeOf<PresenceLinkHandlers["onPeers"]>()
      .parameter(0)
      .toEqualTypeOf<readonly PresencePeer[]>();
    expectTypeOf<SyncLink["send"]>().parameter(0).toEqualTypeOf<Uint8Array>();
    expectTypeOf<SyncLinkHandlers["onUpdate"]>().parameter(0).toEqualTypeOf<Uint8Array>();
    expectTypeOf<DocumentSnapshot>().toEqualTypeOf<{
      readonly state: Uint8Array;
      readonly savedAt: Date;
    }>();
    expectTypeOf<DocumentReplica["encode"]>().returns.toEqualTypeOf<Uint8Array>();
    expectTypeOf<CommentableRef>().toEqualTypeOf<{ readonly model: string; readonly id: string }>();
    expectTypeOf<MentionTarget["id"]>().toEqualTypeOf<string | null>();
    expectTypeOf<CommentView["body"]>().toEqualTypeOf<string | null>();
    expectTypeOf<CommentRules["assistantHandle"]>().toEqualTypeOf<string | null>();
  });
});
