import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  buildPrompt,
  names,
  opencodeArgs,
  parseRouting,
  requireIssue,
  resolveRoute,
  slugify,
} from "../delegate.mjs";

const routing = parseRouting(
  readFileSync(new URL("../../../.agents/routing.yaml", import.meta.url), "utf8"),
);

test("routing.yaml: budget and both executors are present", () => {
  assert.deepEqual(routing.budget, { dailyUsd: 150, warnAt: 0.8 });
  assert.equal(routing.tasks.tests.executor, "opencode");
  assert.equal(routing.tasks.tests.model, "amazon-bedrock/global.moonshotai.kimi-k3");
  assert.equal(routing.tasks.money.executor, "claude");
  assert.equal(routing.tasks["steward-i18n"].agent, "i18n-steward");
});

test("resolveRoute: flag beats env beats routing", () => {
  assert.equal(resolveRoute(routing, { type: "tests" }).executor, "opencode");
  assert.equal(
    resolveRoute(routing, { type: "tests" }, { STACKRA_EXECUTOR: "claude" }).executor,
    "claude",
  );
  assert.equal(
    resolveRoute(routing, { type: "tests", executor: "opencode" }, { STACKRA_EXECUTOR: "claude" })
      .executor,
    "opencode",
  );
  assert.equal(resolveRoute(routing, { type: "tests", agent: "x" }).agent, "x");
});

test("resolveRoute rejects unknown types and executors", () => {
  assert.throws(() => resolveRoute(routing, { type: "nope" }), /unknown task type/);
  assert.throws(
    () => resolveRoute(routing, { type: "tests", executor: "gpt" }),
    /executor must be/,
  );
});

test("slug and branch naming", () => {
  assert.equal(slugify("Add tests for  the Guard plugin!"), "add-tests-for-the-guard-plugin");
  assert.equal(slugify("!!!"), "task");
  assert.deepEqual(names("tests", "Cover logger"), {
    slug: "cover-logger",
    branch: "delegate/tests-cover-logger",
    dir: "stackra-delegate-cover-logger",
  });
  assert.ok(slugify("x".repeat(100)).length <= 40);
});

test("delegation refuses to start without a Linear issue", () => {
  assert.equal(requireIssue("sta-42"), "STA-42");
  assert.throws(() => requireIssue(undefined), /--issue STA-n is required/);
  assert.throws(() => requireIssue("42"), /--issue STA-n is required/);
});

test("prompt carries the rules; --auto only when asked", () => {
  const p = buildPrompt("do it");
  assert.match(p, /Never run git add, commit/);
  assert.match(p, /Finish with a summary/);
  const base = { agent: "build", title: "t", prompt: p };
  assert.ok(!opencodeArgs({ ...base, auto: false }).includes("--auto"));
  assert.ok(opencodeArgs({ ...base, auto: true }).includes("--auto"));
  assert.deepEqual(opencodeArgs({ ...base, model: "m" }).slice(0, 9), [
    "run",
    "--agent",
    "build",
    "--model",
    "m",
    "--format",
    "json",
    "--title",
    "t",
  ]);
});
