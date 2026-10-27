/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./node` entry of @stackra/ai: the eight table models, the two Postgres stores
 *          and the tenant-key cast are exported, and nothing else.
 * Boundary: test only; imports the stand-in barrel through its `#node` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 15); ADR 0399.
 */
import { describe, expect, it } from "@stackra/testing";

import * as node from "#node/index";

describe("@stackra/ai/node", () => {
  it("exports exactly its models, stores and cast", () => {
    expect(Object.keys(node).sort()).toEqual([
      "A2aTask",
      "Conversation",
      "Embedding",
      "Message",
      "PostgresConversationStoreDriver",
      "PostgresRunStoreDriver",
      "Run",
      "RunApproval",
      "RunStep",
      "ScopeKeyCast",
      "ToolCall",
    ]);
  });
});
