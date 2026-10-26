/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./contracts` entry of @stackra/ai: the six runtime ports and the three run
 *          enums are exported, nothing else is as a value, and the exchanged records resolve.
 * Boundary: test only; imports the stand-in barrel through its `#contracts` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 15); STA-781.
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as contracts from "#contracts/index";
import type { RecordScope, RunRecord, ToolCallRecord, ToolCallResult } from "#contracts/index";

describe("@stackra/ai/contracts", () => {
  it("exports exactly its ports and enums", () => {
    expect(Object.keys(contracts).sort()).toEqual([
      "AgentModels",
      "AgentQueue",
      "ConversationStore",
      "InstructionSource",
      "RunApprovalStatus",
      "RunStatus",
      "RunStore",
      "ToolCallOutcome",
      "ToolDispatcher",
    ]);
  });

  it("resolves the exchanged records", () => {
    expectTypeOf<RunRecord["record"]>().toEqualTypeOf<RecordScope | undefined>();
    expectTypeOf<ToolCallRecord["inputHash"]>().toEqualTypeOf<string>();
    expectTypeOf<
      Extract<ToolCallResult, { outcome: "approval_required" }>["approvalId"]
    >().toEqualTypeOf<string>();
  });
});
