/**
 * @module tools/scripts/linear.test
 *
 * Purpose: hold `pnpm linear` and linear-reconcile to their contract: token choice and re-minting, no token in
 * output, the CI key check, and the reconcile plan's rules and idempotency.
 * Boundary: mocked fetch only; no network, no repository writes.
 * Runtime: node — node:test and node:assert.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { auth, client, digest, main, prCarriesKey } from "../linear.mjs";
import { adrStatuses, apply, plan, prKeys } from "../linear-reconcile.mjs";

const SECRET = "lin_api_SECRETVALUE";

/** A fetch stub answering GraphQL by the first matching substring of the query; records every call. */
function stub(routes, { status = 200 } = {}) {
  const calls = [];
  const fetch = async (url, init) => {
    calls.push({ url, init });
    if (url.endsWith("/oauth/token"))
      return { ok: true, status: 200, json: async () => ({ access_token: "minted" }) };
    const { query, variables } = JSON.parse(init.body);
    const hit = Object.entries(routes).find(([k]) => query.includes(k));
    const data = typeof hit?.[1] === "function" ? hit[1](variables, init) : hit?.[1];
    return { ok: status < 400, status, json: async () => data ?? { data: {} } };
  };
  return { fetch, calls };
}

test("auth: app token beats client credentials beats personal key", () => {
  assert.deepEqual(auth({ LINEAR_API_KEY: "k" }), { header: "k", app: false, mintable: false });
  assert.equal(auth({ LINEAR_AGENT_TOKEN: "t", LINEAR_API_KEY: "k" }).header, "Bearer t");
  const creds = {
    LINEAR_AGENT_CLIENT_ID: "i",
    LINEAR_AGENT_CLIENT_SECRET: "s",
    LINEAR_API_KEY: "k",
  };
  assert.deepEqual(auth(creds), { header: null, app: true, mintable: true });
  assert.equal(auth({}), null);
});

test("an expired app token is re-minted once and the call retried", async () => {
  let n = 0;
  const { fetch, calls } = stub({
    viewer: (_v, init) =>
      n++ === 0
        ? {
            errors: [
              { message: "Authentication required", extensions: { code: "AUTHENTICATION_ERROR" } },
            ],
          }
        : { data: { viewer: { id: init.headers.authorization } } },
  });
  const env = {
    LINEAR_AGENT_TOKEN: "old",
    LINEAR_AGENT_CLIENT_ID: "i",
    LINEAR_AGENT_CLIENT_SECRET: "s",
  };
  const d = await client({ env, fetch }).gql("query{viewer{id}}");
  assert.equal(d.viewer.id, "Bearer minted");
  const mintCall = calls.find((c) => c.url.endsWith("/oauth/token"));
  assert.match(String(mintCall.init.body), /grant_type=client_credentials/);
  assert.match(String(mintCall.init.body), /app%3Aassignable/);
});

test("errors and output never contain the token", async () => {
  const { fetch } = stub({ issue: { errors: [{ message: "Entity not found" }] } }, { status: 400 });
  const lines = [];
  await assert.rejects(
    main(["comment", "STA-1", "hi"], {
      env: { LINEAR_API_KEY: SECRET },
      fetch,
      log: (l) => lines.push(l),
    }),
    (e) => !e.message.includes(SECRET) && /Entity not found/.test(e.message),
  );
  assert.ok(!lines.join("\n").includes(SECRET));
  await assert.rejects(client({ env: {} }).gql("query{viewer{id}}"), /no Linear token/);
});

const ISSUE = {
  id: "uuid-1",
  identifier: "STA-7",
  title: "T",
  url: "u",
  state: { id: "s", name: "Todo", type: "unstarted" },
  team: { id: "team" },
  labels: { nodes: [] },
};

test("start moves to In Progress, delegates to the app (not assignee) and comments the branch", async () => {
  const { fetch, calls } = stub({
    "issue(id": { data: { issue: ISSUE } },
    teams: { data: { teams: { nodes: [{ id: "team" }] } } },
    workflowStates: { data: { workflowStates: { nodes: [{ id: "st-ip" }] } } },
    viewer: { data: { viewer: { id: "app-user" } } },
    issueUpdate: { data: { issueUpdate: { success: true } } },
    commentCreate: { data: { commentCreate: { success: true } } },
  });
  const code = await main(["start", "sta-7", "--branch", "figentra/sta-7-x"], {
    env: { LINEAR_AGENT_TOKEN: "t" },
    fetch,
    log: () => {},
  });
  assert.equal(code, 0);
  const inputs = calls
    .map((c) => JSON.parse(c.init.body))
    .filter((b) => b.query.includes("issueUpdate"))
    .map((b) => b.variables.i);
  assert.deepEqual(inputs, [{ stateId: "st-ip" }, { delegateId: "app-user" }]);
  const comment = calls
    .map((c) => JSON.parse(c.init.body))
    .find((b) => b.query.includes("commentCreate"));
  assert.match(comment.variables.i.body, /figentra\/sta-7-x/);
});

test("create adds the agent label when an agent runs it; dry-run writes nothing", async () => {
  const { fetch, calls } = stub({
    teams: { data: { teams: { nodes: [{ id: "team" }] } } },
    issueLabels: (v) => ({ data: { issueLabels: { nodes: [{ id: `lbl-${v.n}` }] } } }),
  });
  const lines = [];
  await main(["create", "--title", "X", "--labels", "docs", "--dry-run"], {
    env: { LINEAR_API_KEY: "k", CLAUDECODE: "1" },
    fetch,
    log: (l) => lines.push(l),
  });
  assert.match(lines.join(), /would create "X" \[docs, agent\]/);
  assert.ok(!calls.some((c) => JSON.parse(c.init.body).query.includes("mutation")));
});

test("digest: In Progress first, owner steps tagged, deduped, capped at 8 lines", () => {
  const row = (n, state = "In Progress") => ({
    identifier: `STA-${n}`,
    title: `t${n}`,
    state: { name: state },
  });
  assert.deepEqual(digest([row(1)], [row(1), row(2, "Todo")]), [
    "STA-1 In Progress: t1",
    "STA-2 Todo: t2 [owner]",
  ]);
  const many = digest(
    Array.from({ length: 12 }, (_, i) => row(i)),
    [],
  );
  assert.equal(many.length, 8);
  assert.match(many[7], /and 5 more/);
});

test("check-pr: key in title or branch, or an exempt lane", () => {
  assert.ok(prCarriesKey({ title: "feat: x", branch: "figentra/sta-42-y" }).ok);
  assert.ok(prCarriesKey({ title: "fix(x): y (STA-3)", branch: "z" }).ok);
  assert.ok(prCarriesKey({ title: "chore", branch: "renovate/foo" }).ok);
  assert.ok(prCarriesKey({ title: "chore", branch: "x", labels: ["chore-lane"] }).ok);
  assert.ok(!prCarriesKey({ title: "feat: x", branch: "feature/x" }).ok);
});

test("prKeys: branch and Fixes/Closes close; title, Refs and Linear only mention", () => {
  assert.deepEqual(
    prKeys({
      title: "chore: after STA-10 shipped",
      headRefName: "figentra/sta-4-a",
      body: "Fixes STA-1, STA-2 and STA-3\nRefs: STA-11\nsee STA-6\nLinear: STA-8",
    }),
    {
      closes: ["STA-4", "STA-1", "STA-2", "STA-3"],
      mentions: ["STA-4", "STA-1", "STA-2", "STA-3", "STA-10", "STA-11", "STA-8"],
    },
  );
});

test("a merged PR that only mentions an issue does not close it", () => {
  const actions = plan({
    issues: [iss("STA-10", "In Progress", "started", { startedAt: new Date(NOW).toISOString() })],
    mergedPrs: [
      {
        number: 3,
        url: "pr3",
        title: "chore: after STA-10",
        headRefName: "x",
        body: "Refs: STA-10",
      },
    ],
    openPrs: [],
    branches: [],
    adrs,
    now: NOW,
  });
  assert.deepEqual(actions, []);
});

test("stale: a recently started issue is not stale; a human-removed label is not re-added", () => {
  const base = { mergedPrs: [], openPrs: [], branches: [], adrs, now: NOW };
  const fresh = iss("STA-20", "In Progress", "started", {
    startedAt: new Date(NOW - DAY).toISOString(),
  });
  assert.deepEqual(plan({ ...base, issues: [fresh] }), []);
  const old = new Date(NOW - 10 * DAY).toISOString();
  const first = plan({
    ...base,
    issues: [iss("STA-21", "In Progress", "started", { startedAt: old })],
  });
  assert.equal(first[0].addLabel, "stale");
  const removed = iss("STA-21", "In Progress", "started", {
    startedAt: old,
    comments: [`x\n\n— linear-reconcile (${first[0].tag})`],
  });
  assert.deepEqual(plan({ ...base, issues: [removed] }), []);
});

test("apply writes the marker comment even when Linear refuses a duplicate attachment", async () => {
  const done = [];
  const L = {
    setState: async () => done.push("state"),
    link: async () => {
      throw new Error("Unable to create issue attachment");
    },
    comment: async (_i, body) => done.push(body),
  };
  const issue = { identifier: "STA-1", attachments: { nodes: [] } };
  const failed = await apply(
    L,
    [{ key: "STA-1", rule: "b", state: "In Review", link: "pr", comment: "c", tag: "review:#1" }],
    new Map([["STA-1", issue]]),
    () => {},
  );
  assert.equal(failed, 0);
  assert.match(done[1], /linear-reconcile \(review:#1\)/);
});

const iss = (key, state, type, extra = {}) => ({
  identifier: key,
  title: "Work",
  state: { name: state, type },
  labels: [],
  comments: [],
  ...extra,
});
const NOW = Date.parse("2026-10-19T00:00:00Z");
const DAY = 24 * 3600 * 1000;
const adrs = adrStatuses([
  ["0065-x.mdx", 'description: "Accepted · 2026-10-19"'],
  ["0066-y.mdx", 'description: "Proposed · 2026-10-19"'],
]);

test("reconcile plan covers rules a–e", () => {
  const actions = plan({
    issues: [
      iss("STA-1", "In Progress", "started"),
      iss("STA-2", "In Progress", "started"),
      iss("STA-3", "Todo", "unstarted", { title: "Decide ADR 0065" }),
      iss("STA-4", "In Progress", "started"),
      iss("STA-5", "Backlog", "backlog", { title: "Build what ADR 0065 says" }),
      iss("STA-6", "Backlog", "backlog", { title: "Decide ADR 0066" }),
      iss("STA-7", "In Progress", "started", { labels: ["stale"] }),
    ],
    mergedPrs: [{ number: 10, url: "pr10", title: "feat: a", headRefName: "figentra/sta-1-a" }],
    openPrs: [{ number: 11, url: "pr11", title: "feat: b (STA-2)", headRefName: "b" }],
    branches: [{ name: "figentra/sta-7-x", at: NOW - DAY }],
    adrs,
    now: NOW,
  });
  const by = Object.fromEntries(actions.map((a) => [a.key, a]));
  assert.equal(by["STA-1"].state, "Done");
  assert.equal(by["STA-2"].state, "In Review");
  assert.equal(by["STA-3"].state, "Done");
  assert.match(by["STA-3"].link, /0065-x\.mdx$/);
  assert.equal(by["STA-4"].addLabel, "stale");
  assert.equal(by["STA-5"].rule, "e");
  assert.equal(by["STA-6"], undefined);
  assert.equal(by["STA-7"].removeLabel, "stale");
});

test("reconcile plan is idempotent: a marker already on the issue skips the action", () => {
  const input = {
    issues: [
      iss("STA-1", "In Progress", "started", {
        comments: ["Merged: pr10\n\n— linear-reconcile (done:#10)"],
      }),
    ],
    mergedPrs: [{ number: 10, url: "pr10", title: "x", headRefName: "figentra/sta-1-a" }],
    openPrs: [],
    branches: [{ name: "figentra/sta-1-a", at: NOW }],
    adrs,
    now: NOW,
  };
  assert.deepEqual(plan(input), []);
});

test("a PR attached to the issue counts as linked even without the key in its title or branch", () => {
  const actions = plan({
    issues: [iss("STA-9", "In Progress", "started", { links: ["pr16"] })],
    mergedPrs: [],
    openPrs: [{ number: 16, url: "pr16", title: "docs: batch", headRefName: "docs/batch" }],
    branches: [],
    adrs,
    now: NOW,
  });
  assert.deepEqual(
    actions.map((a) => [a.key, a.rule, a.state]),
    [["STA-9", "b", "In Review"]],
  );
});
