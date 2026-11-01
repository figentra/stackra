#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: today's and the 7-day OpenCode spend against the daily cap in .agents/routing.yaml (`pnpm ai:spend`).
 * Boundary: reads `.agents/routing.yaml` and runs `opencode stats`; writes nothing.
 * Runtime: node
 * Governing contract: ADR 0066 (delegation to OpenCode by routing matrix).
 * Exit: 0 under the cap, 1 at or over it. Spend comes from `opencode stats --cost --json` (field `cost`, USD).
 * Pure functions (parseBudget, costOf, evaluate, formatLine) take injected data; only `main` shells out.
 * Secrets: forbidden — stats carry token counts and cost, never credentials.
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const DEFAULT_BUDGET = { dailyUsd: 150, warnAt: 0.8 };

/** shortcut: reads the indented `budget:` block (`dailyUsd: N`, `warnAt: N`) by regex, not a YAML parser. */
export function parseBudget(yamlText) {
  const line = /^budget:[ \t]*\n((?:[ \t]+\S.*\n?)*)/m.exec(yamlText)?.[1] ?? "";
  const num = (key, fallback) => {
    const m = new RegExp(`${key}:\\s*([0-9.]+)`).exec(line);
    return m ? Number(m[1]) : fallback;
  };
  return {
    dailyUsd: num("dailyUsd", DEFAULT_BUDGET.dailyUsd),
    warnAt: num("warnAt", DEFAULT_BUDGET.warnAt),
  };
}

/** The `cost` field of an `opencode stats --json` payload; 0 when absent. */
export function costOf(stats) {
  const cost = Number(stats?.cost);
  return Number.isFinite(cost) ? cost : 0;
}

/** level: ok under warnAt × cap, warn from there up to the cap, over at or above the cap. */
export function evaluate({ today, week }, { dailyUsd, warnAt }) {
  const level = today >= dailyUsd ? "over" : today >= dailyUsd * warnAt ? "warn" : "ok";
  return { level, today, week, dailyUsd, pct: Math.round((today / dailyUsd) * 100) };
}

export function formatLine(r) {
  const tag = { ok: "ok", warn: "WARNING: nearing cap", over: "OVER CAP" }[r.level];
  return `OpenCode spend: today $${r.today.toFixed(2)} of $${r.dailyUsd} (${r.pct}%), 7 days $${r.week.toFixed(2)} — ${tag}`;
}

/** Run `opencode stats` for N days (0 = today); returns the parsed JSON or throws. */
export function fetchStats(days, { timeout = 30_000 } = {}) {
  const r = spawnSync("opencode", ["stats", "--days", String(days), "--cost", "--json"], {
    encoding: "utf8",
    timeout,
    maxBuffer: 64 * 1024 * 1024,
  });
  if (r.error || r.status !== 0)
    throw new Error(r.error?.message ?? `opencode stats exited ${r.status}`);
  return JSON.parse(r.stdout);
}

export function loadBudget(routingPath) {
  try {
    return parseBudget(readFileSync(routingPath, "utf8"));
  } catch {
    return DEFAULT_BUDGET;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const routing = new URL("../../.agents/routing.yaml", import.meta.url);
  try {
    const result = evaluate(
      { today: costOf(fetchStats(0)), week: costOf(fetchStats(7)) },
      loadBudget(routing),
    );
    console.log(formatLine(result));
    process.exit(result.level === "over" ? 1 : 0);
  } catch (error) {
    console.error(`ai-spend: cannot read OpenCode stats (${error.message})`);
    process.exit(2);
  }
}
