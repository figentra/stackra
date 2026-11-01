/**
 * Stackra file contract:
 * Purpose: hold linear-reconcile's multi-repo reads to their contract (STA-1822): the repo list from the data file or
 * `--repos`, merged and open PRs and main-commit trailers from every repo, page caps, repo-qualified markers, and an
 * unreadable repo skipped rather than failed.
 * Boundary: an injected gh stub only; no network, no repository writes; node:test and node:assert.
 * Runtime: node
 * Governing contract: ADR 0022 (tests live in tests folders); ADR 0065 (rule 7).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gather, plan, readRepos } from "../linear-reconcile.mjs";

const pr = (number, extra = {}) => ({
  number,
  url: `u${number}`,
  title: "x",
  headRefName: "x",
  body: "",
  updatedAt: "2026-10-30T00:00:00Z",
  isCrossRepository: false,
  ...extra,
});
const commit = (sha, message) => ({ sha, html_url: `c${sha}`, commit: { message } });

/** gh stub: `data[repo] = { open, merged, commits: [page1, page2, …] }`; a repo missing from `data` fails. */
function ghStub(data) {
  const calls = [];
  const gh = (args) => {
    calls.push(args);
    if (args[0] === "api") {
      const [, repo, page] = args[1].match(/^repos\/figentra\/([^/]+)\/commits\?.*page=(\d+)$/);
      if (!data[repo]) throw new Error(`gh: Not Found (HTTP 404)\nmore`);
      return data[repo].commits?.[page - 1] ?? [];
    }
    const repo = args[args.indexOf("-R") + 1].split("/")[1];
    if (!data[repo]) throw new Error("gh: Could not resolve to a Repository");
    return data[repo][args[args.indexOf("--state") + 1]] ?? [];
  };
  return { gh, calls };
}

const ISSUE = (key, extra = {}) => ({
  identifier: key,
  title: "Work",
  state: { name: "In Progress", type: "started" },
  labels: [],
  comments: [],
  startedAt: "2026-10-31T00:00:00Z",
  ...extra,
});
const NOW = Date.parse("2026-11-01T00:00:00Z");
const run = (input) => plan({ openPrs: [], branches: [], adrs: {}, now: NOW, ...input });

test("readRepos: the data file lists the org and repos; --repos overrides the list", () => {
  const text = readFileSync(new URL("../linear-reconcile.repos.yaml", import.meta.url), "utf8");
  const file = readRepos([], text);
  assert.equal(file.org, "figentra");
  assert.ok(file.repos.includes("stackra") && file.repos.includes("billing"));
  assert.deepEqual(readRepos(["--repos", "pay,tamo"], text).repos, ["pay", "tamo"]);
  assert.deepEqual(readRepos(["--repos=os"], text).repos, ["os"]);
});

test("gather: PRs and main commits from every repo, fork PRs dropped, unreadable repos skipped", () => {
  const { gh, calls } = ghStub({
    stackra: { merged: [pr(5, { headRefName: "figentra/sta-1-a" })], open: [pr(6)] },
    billing: {
      merged: [pr(5, { title: "feat: invoices (STA-2)" }), pr(7, { isCrossRepository: true })],
      commits: [[commit("abcdef123", "fix: x\n\nRefs: STA-3")]],
    },
  });
  const out = gather({
    org: "figentra",
    repos: ["stackra", "billing", "gone"],
    since: "2026-10-18",
    maxPages: 2,
    gh,
  });
  assert.deepEqual(
    out.mergedPrs.map((p) => p.ref),
    ["#5", "billing#5", "billing@abcdef1"],
  );
  assert.deepEqual(
    out.openPrs.map((p) => p.ref),
    ["#6"],
  );
  assert.deepEqual(out.skipped, ["figentra/gone: gh: Could not resolve to a Repository"]);
  const merged = calls.find((a) => a.includes("merged"));
  assert.ok(merged.includes("merged:>=2026-10-18"));
  assert.equal(merged[merged.indexOf("--limit") + 1], "200");
  assert.ok(calls.some((a) => a[0] === "api" && a[1].includes("sha=main&since=2026-10-18T")));
});

test("gather: commit pages stop at a short page and at the cap", () => {
  const full = Array.from({ length: 100 }, (_, i) => commit(`${i}`.padStart(7, "0"), "chore"));
  const { gh, calls } = ghStub({ os: { commits: [full, full, full] } });
  const out = gather({ org: "figentra", repos: ["os"], since: "2026-10-18", maxPages: 2, gh });
  assert.equal(out.mergedPrs.length, 200);
  assert.equal(calls.filter((a) => a[0] === "api").length, 2);
  const short = ghStub({ os: { commits: [full, [commit("1234567", "x")]] } });
  gather({ org: "figentra", repos: ["os"], since: "2026-10-18", maxPages: 5, gh: short.gh });
  assert.equal(short.calls.filter((a) => a[0] === "api").length, 2);
});

test("plan: work merged outside core closes its issue with a repo-qualified marker; a title never closes", () => {
  const { gh } = ghStub({
    stackra: { merged: [pr(5, { title: "chore: after STA-7" })] },
    billing: {
      merged: [pr(5, { url: "b5", title: "feat: invoices", headRefName: "figentra/sta-2-x" })],
    },
    tamo: {
      commits: [[commit("abcdef123", "fix: y\n\nRefs: STA-3"), commit("1111111", "Part of STA-4")]],
    },
  });
  const { mergedPrs, openPrs } = gather({
    org: "figentra",
    repos: ["stackra", "billing", "tamo"],
    since: "2026-10-18",
    maxPages: 1,
    gh,
  });
  const actions = run({
    issues: [ISSUE("STA-2"), ISSUE("STA-3"), ISSUE("STA-4"), ISSUE("STA-7")],
    mergedPrs,
    openPrs,
  });
  assert.deepEqual(
    actions.map((a) => [a.key, a.state, a.tag, a.link]),
    [
      ["STA-2", "Done", "done:billing#5", "b5"],
      ["STA-3", "Done", "done:tamo@abcdef1", "cabcdef123"],
    ],
  );
});

test("plan: a merged PR wins over its squash commit, and any merged marker keeps a reopened issue open", () => {
  const mergedPrs = [
    { ref: "pay#9", number: 9, url: "p9", title: "feat: a", headRefName: "figentra/sta-5-a" },
    { ref: "pay@abcdef1", url: "c1", body: "feat: a (#9)\n\nRefs: STA-5" },
  ];
  const first = run({ issues: [ISSUE("STA-5")], mergedPrs });
  assert.equal(first[0].tag, "done:pay#9");
  // The PR fell out of the window; its commit's marker is not on the issue, but the PR's is.
  const reopened = ISSUE("STA-5", { comments: ["Merged: p9\n\n— linear-reconcile (done:pay#9)"] });
  assert.deepEqual(run({ issues: [reopened], mergedPrs }), []);
});

test("plan: an open PR in another repo keeps its issue in review over merged work elsewhere", () => {
  const actions = run({
    issues: [ISSUE("STA-6")],
    mergedPrs: [{ ref: "#1", number: 1, url: "u1", headRefName: "figentra/sta-6-a" }],
    openPrs: [
      { ref: "os#2", number: 2, url: "u2", title: "feat: b", headRefName: "figentra/sta-6-b" },
    ],
  });
  assert.deepEqual(
    actions.map((a) => [a.key, a.state, a.tag]),
    [["STA-6", "In Review", "review:os#2"]],
  );
});
