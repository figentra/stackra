/**
 * Stackra file contract:
 * Purpose: unit tests of the consumer gate's allow-list: `loadConsumerGateAllow`, `consumerGateSignatures` and
 *          `judgeConsumerGateStep` (a step is excused only when every failure line has a live entry; an expired
 *          entry excuses nothing and is named; a malformed entry is a problem).
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); STA-1813.
 */
// @covers sta-1813:FR-005 sta-1813:P-005
import { describe, expect, it } from "@stackra/testing";

import { consumerGateSignatures } from "#node/consumer-gate/functions/consumer-gate-signatures.function";
import { judgeConsumerGateStep } from "#node/consumer-gate/functions/judge-consumer-gate-step.function";
import { loadConsumerGateAllow } from "#node/consumer-gate/functions/load-consumer-gate-allow.function";

const TODAY = "2026-11-01";

const entry = (over: Record<string, unknown> = {}): Record<string, unknown> => ({
  product: "billing",
  step: "typecheck",
  match: "TS6133",
  issue: "STA-1",
  added: "2026-10-30",
  expires: "2026-11-10",
  ...over,
});

const allowOf = (...entries: Record<string, unknown>[]) =>
  loadConsumerGateAllow(
    `allow:\n${entries.map((item) => `  - ${JSON.stringify(item)}`).join("\n")}\n`,
    TODAY,
  );

describe("consumerGateSignatures and judgeConsumerGateStep", () => {
  const log = "ok\nfoo.ts(1,2): error TS6133 'A' is never read\nbar.ts(3,4): error TS2589 deep\n";

  it("keeps failure lines only", () => {
    expect(consumerGateSignatures(log)).toHaveLength(2);
  });

  it("excuses a step only when every failure line has a live entry", () => {
    const live = allowOf(entry(), entry({ match: "TS2589", issue: "STA-2" })).entries;
    expect(judgeConsumerGateStep(1, log, "billing", "typecheck", live)).toEqual({
      status: "allowed",
      issues: ["STA-1", "STA-2"],
    });
    expect(judgeConsumerGateStep(0, "", "billing", "typecheck", live).status).toBe("pass");
    expect(
      judgeConsumerGateStep(1, log, "billing", "typecheck", allowOf(entry()).entries).status,
    ).toBe("fail");
    expect(judgeConsumerGateStep(1, log, "pay", "typecheck", live).status).toBe("fail");
    expect(judgeConsumerGateStep(1, "killed\n", "billing", "typecheck", live).status).toBe("fail");
  });

  it("lets an entry for a step cover its per-service ids", () => {
    const byBase = allowOf(entry({ step: "test:int", match: "ERR_PNPM_X" })).entries;
    expect(
      judgeConsumerGateStep(1, "ERR_PNPM_X boom\n", "billing", "test:int/billing", byBase).status,
    ).toBe("allowed");
  });
});

describe("loadConsumerGateAllow", () => {
  it("names an expired entry and refuses a malformed one", () => {
    const { entries, problems } = allowOf(
      entry({ expires: "2026-10-31" }),
      entry({ issue: "ABC" }),
      entry({ expires: "2026-12-30" }),
      entry({ match: undefined }),
    );
    expect(problems).toHaveLength(3);
    const failure = "x.ts: error TS6133 'A'\n";
    expect(judgeConsumerGateStep(1, failure, "billing", "typecheck", entries)).toEqual({
      status: "fail",
      uncovered: [failure.trim()],
      expired: ["STA-1"],
    });
  });

  it("loads an empty list", () => {
    expect(loadConsumerGateAllow("allow: []\n", TODAY)).toEqual({ entries: [], problems: [] });
  });
});
