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
  class: "product",
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
    expect(loadConsumerGateAllow("allow: []\n", TODAY)).toEqual({
      entries: [],
      problems: [],
      refused: [],
    });
  });

  it("refuses a missing or never-allowed class, listing it as refused", () => {
    for (const cls of [
      "security",
      "tenant-isolation",
      "data-integrity",
      "leak",
      undefined,
      "other",
    ]) {
      const { entries, refused } = allowOf(entry({ class: cls }));
      expect(entries).toEqual([]);
      expect(refused).toHaveLength(1);
    }
    expect(allowOf(entry({ class: "leak" })).refused[0]).toMatch(/leak can never be allow-listed/);
    for (const cls of ["product", "flaky", "environment", "known-core"]) {
      expect(allowOf(entry({ class: cls })).entries).toHaveLength(1);
    }
  });

  it("refuses loose matches, future and malformed dates, and a non-list", () => {
    expect(allowOf(entry({ match: "Error" })).problems).toHaveLength(1);
    expect(allowOf(entry({ match: "AssertionError: x" })).entries).toHaveLength(1);
    expect(allowOf(entry({ match: "ERR_X" })).entries).toHaveLength(1);
    expect(allowOf(entry({ added: "2026-11-02", expires: "2026-11-10" })).problems[0]).toMatch(
      /future/,
    );
    expect(allowOf(entry({ added: "10/30/2026" })).problems).toHaveLength(1);
    expect(() => loadConsumerGateAllow("allow: nope\n", TODAY)).toThrow(/must be a list/);
    expect(() => loadConsumerGateAllow("allow: []\n", "yesterday")).toThrow(/YYYY-MM-DD/);
  });
});

describe("consumerGateSignatures under turbo", () => {
  it("strips the pkg:task prefix so anchored lines match, and keeps one entry from excusing everything", () => {
    const log =
      "@p/billing:test: FAIL  src/a.test.ts > a\n@p/billing:test: Error: expected 1 to be 2\nbilling:typecheck: a.ts(1,1): error TS6133 'A'\n";
    expect(consumerGateSignatures(log)).toEqual([
      "FAIL  src/a.test.ts > a",
      "Error: expected 1 to be 2",
      "a.ts(1,1): error TS6133 'A'",
    ]);
    const only = allowOf(entry({ step: "test", match: "Error: expected" })).entries;
    expect(judgeConsumerGateStep(1, log, "billing", "test", only).status).toBe("fail");
  });
});
