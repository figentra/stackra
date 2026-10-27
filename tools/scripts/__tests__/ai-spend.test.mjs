/**
 * Stackra file contract:
 * Purpose: hold `ai-spend.mjs`'s pure functions to their contract: the budget parse and its defaults, a missing cost,
 *          the ok, warn and over levels, and the report line.
 * Boundary: pure functions on injected data; never runs `opencode`.
 * Runtime: node
 * Governing contract: ADR 0022 (tests live in tests folders); ADR 0182 (testing strategy).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { costOf, evaluate, formatLine, parseBudget } from "../ai-spend.mjs";

test("parseBudget reads the routing line and falls back to defaults", () => {
  assert.deepEqual(parseBudget("budget:\n  dailyUsd: 90\n  warnAt: 0.5\n"), {
    dailyUsd: 90,
    warnAt: 0.5,
  });
  assert.deepEqual(parseBudget(""), { dailyUsd: 150, warnAt: 0.8 });
});

test("costOf tolerates missing cost", () => {
  assert.equal(costOf({ cost: 12.5 }), 12.5);
  assert.equal(costOf({}), 0);
  assert.equal(costOf(null), 0);
});

test("evaluate: ok, warn at 80%, over at the cap", () => {
  const b = { dailyUsd: 150, warnAt: 0.8 };
  assert.equal(evaluate({ today: 10, week: 50 }, b).level, "ok");
  assert.equal(evaluate({ today: 120, week: 0 }, b).level, "warn");
  assert.equal(evaluate({ today: 150, week: 0 }, b).level, "over");
});

test("formatLine names the level", () => {
  const line = formatLine(evaluate({ today: 150, week: 300 }, { dailyUsd: 150, warnAt: 0.8 }));
  assert.match(line, /\$150\.00 of \$150 \(100%\).*OVER CAP/);
});
