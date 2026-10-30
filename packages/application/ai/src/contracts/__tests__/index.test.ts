/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./contracts` entry of @stackra/ai: the six runtime ports, the run
 *          enums, the client tool enums, the `PageReader` port and `PageReadRefusal` are exported, nothing else is as a value, and the exchanged records resolve.
 * Boundary: test only; imports the stand-in barrel through its `#contracts` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 15); STA-781; ADR 0450; ADR 0490.
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as contracts from "#contracts/index";
import type {
  ClientToolRow,
  PageReading,
  PageReadResult,
  ProductHint,
  RecordScope,
  RunRecord,
  ToolCallRecord,
  ToolCallResult,
} from "#contracts/index";

describe("@stackra/ai/contracts", () => {
  it("exports exactly its ports and enums", () => {
    expect(Object.keys(contracts).sort()).toEqual([
      "A2aDirection",
      "AgentModels",
      "AgentQueue",
      "ClientToolKind",
      "ConversationStore",
      "InstructionSource",
      "PageReadRefusal",
      "PageReader",
      "RunApprovalStatus",
      "RunStatus",
      "RunStore",
      "SurfaceKind",
      "ToolCallOutcome",
      "ToolDispatcher",
    ]);
  });

  it("types a client tool row as an L0 tool from the client", () => {
    expectTypeOf<ClientToolRow["from"]>().toEqualTypeOf<"client">();
    expectTypeOf<ClientToolRow["risk"]>().toEqualTypeOf<"L0">();
  });

  it("resolves the exchanged records", () => {
    expectTypeOf<RunRecord["record"]>().toEqualTypeOf<RecordScope | undefined>();
    expectTypeOf<ToolCallRecord["inputHash"]>().toEqualTypeOf<string>();
    expectTypeOf<
      Extract<ToolCallResult, { outcome: "approval_required" }>["approvalId"]
    >().toEqualTypeOf<string>();
    expectTypeOf<Extract<PageReadResult, { ok: true }>["page"]>().toEqualTypeOf<PageReading>();
    expectTypeOf<PageReading["products"]>().toEqualTypeOf<readonly ProductHint[]>();
    expectTypeOf<ProductHint["price"]>().toEqualTypeOf<string | undefined>();
  });
});
