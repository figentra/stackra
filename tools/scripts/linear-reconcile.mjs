#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: bring Linear team STA back in line with GitHub and the ADRs (ADR 0065 rule 7: a separate, non-blocking job).
 *   (a) issues referenced by a merged PR → Done      (b) issues with an open PR → In Review
 *   (c) "Decide ADR NNNN" closed once ADR NNNN is Accepted/Superseded
 *   (d) In Progress with no branch/PR activity for 3 days → `stale` label + comment (label removed when active again)
 *   (e) Backlog/Todo issues whose title names an ADR that is now Accepted → comment
 *   (f) summary to stdout and $GITHUB_STEP_SUMMARY
 * Idempotent: every comment carries a `linear-reconcile (<tag>)` marker and an action whose marker is already on the
 * issue is skipped, so a human who reopens an issue is not overridden. `--dry-run` writes nothing.
 * Inputs: `gh pr list` (GH_TOKEN in CI), `git for-each-ref refs/remotes/origin`, apps/docs/src/adr/*.mdx.
 * Secrets: LINEAR_AGENT_TOKEN or LINEAR_API_KEY from the environment only (see linear.mjs); never printed.
 */
import { execFileSync } from "node:child_process";
import { appendFileSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { client, linear, TEAM } from "./linear.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const REPO = "figentra/stackra";
const ADR_DIR = "apps/docs/src/adr";
const STALE_MS = 3 * 24 * 3600 * 1000;
const MARK = (tag) => `linear-reconcile (${tag})`;

/** STA keys a PR references: title, branch, and `Refs|Fixes|Closes|Resolves|Linear: STA-n` lines of the body. */
export function prKeys({ title = "", headRefName = "", body = "" }) {
  const keys = new Set();
  for (const s of [title, headRefName])
    for (const m of s.matchAll(/\bSTA-(\d+)\b/gi)) keys.add(`STA-${m[1]}`);
  for (const m of (body ?? "").matchAll(
    /\b(?:Refs|Fixes|Closes|Resolves|Linear)\b:?\s*STA-(\d+)\b/gi,
  ))
    keys.add(`STA-${m[1]}`);
  return [...keys];
}

/** ADR number → status word, from the `description: "Accepted · …"` frontmatter. */
export function adrStatuses(files) {
  const out = {};
  for (const [name, text] of files) {
    const n = name.match(/^(\d{4})-/)?.[1];
    const status = text.match(/^description:\s*"?(\w+)/m)?.[1];
    if (n && status) out[n] = { status, file: name };
  }
  return out;
}

const hasMark = (issue, tag) => issue.comments.some((c) => c.includes(MARK(tag)));
const adrUrl = (file) => `https://github.com/${REPO}/blob/main/${ADR_DIR}/${file}`;

/**
 * Pure: the actions that reconcile `issues` (open STA issues) with GitHub and the ADRs.
 * issue: { identifier, title, state:{name,type}, labels:[name], comments:[body], links?:[attachment url] }
 * pr: { number, url, title, headRefName, body, updatedAt }; branches: [{ name, at: ms }].
 */
const refs = (prs) => {
  const m = new Map();
  for (const pr of prs) for (const k of prKeys(pr)) m.set(k, [...(m.get(k) ?? []), pr]);
  return m;
};

export function plan({ issues, mergedPrs, openPrs, branches, adrs, now }) {
  const actions = [];
  const open = refs(openPrs);
  const merged = refs(mergedPrs);
  const act = (issue, rule, a) => actions.push({ key: issue.identifier, rule, ...a });

  for (const issue of issues) {
    const { name, type } = issue.state;
    // A PR also counts when its URL is attached to the issue (the GitHub integration or `pnpm linear link`).
    const attached = (prs) => prs.filter((pr) => issue.links?.includes(pr.url));
    const either = (m, prs) =>
      m.get(issue.identifier) ?? (attached(prs).length ? attached(prs) : undefined);
    const prsOpen = either(open, openPrs);
    const prsMerged = either(merged, mergedPrs);

    // (b) before (a): an issue with any PR still open is not finished.
    if (prsOpen) {
      const pr = prsOpen[0];
      const tag = `review:#${pr.number}`;
      if (name !== "In Review" && !hasMark(issue, tag))
        act(issue, "b", { state: "In Review", link: pr.url, comment: `In review: ${pr.url}`, tag });
      continue;
    }
    if (prsMerged) {
      const pr = prsMerged[0];
      const tag = `done:#${pr.number}`;
      if (!hasMark(issue, tag))
        act(issue, "a", { state: "Done", link: pr.url, comment: `Merged: ${pr.url}`, tag });
      continue;
    }

    // (c) Decide ADR NNNN
    const decide = issue.title.match(/\bDecide ADR[ -]?(\d{4})\b/i)?.[1];
    const adr = decide && adrs[decide];
    if (adr && /^(Accepted|Superseded)$/i.test(adr.status)) {
      const tag = `adr:${decide}`;
      if (!hasMark(issue, tag))
        act(issue, "c", {
          state: "Done",
          link: adrUrl(adr.file),
          comment: `ADR ${decide} is ${adr.status}: ${adrUrl(adr.file)}`,
          tag,
        });
      continue;
    }

    // (d) stale In Progress
    if (name === "In Progress") {
      const n = issue.identifier.split("-")[1];
      const times = branches
        .filter((b) => new RegExp(`(^|[/-])sta-${n}(\\D|$)`, "i").test(b.name))
        .map((b) => b.at);
      const last = times.length ? Math.max(...times) : 0;
      const stale = now - last > STALE_MS;
      const labelled = issue.labels.includes("stale");
      if (stale && !labelled)
        act(issue, "d", {
          addLabel: "stale",
          comment: last
            ? `No branch or PR activity since ${new Date(last).toISOString().slice(0, 10)}. Push, open a PR, or move it back.`
            : "In Progress with no linked branch or PR. Push a branch named after the issue, or move it back.",
          tag: `stale:${new Date(now).toISOString().slice(0, 10)}`,
        });
      if (!stale && labelled) act(issue, "d", { removeLabel: "stale" });
    }

    // (e) Backlog/Todo issue naming an ADR that is now Accepted
    if (type === "backlog" || type === "unstarted") {
      for (const m of issue.title.matchAll(/\bADR[ -]?(\d{4})\b/gi)) {
        const a = adrs[m[1]];
        const tag = `adr-accepted:${m[1]}`;
        if (a?.status === "Accepted" && !hasMark(issue, tag))
          act(issue, "e", {
            comment: `ADR ${m[1]} is now Accepted (${adrUrl(a.file)}). Pick this up or close it.`,
            tag,
          });
      }
    }
  }
  return actions;
}

export const describe = (a) =>
  [
    a.key,
    `(${a.rule})`,
    a.state && `→ ${a.state}`,
    a.addLabel && `+${a.addLabel}`,
    a.removeLabel && `-${a.removeLabel}`,
    a.comment && `"${a.comment.slice(0, 80)}"`,
  ]
    .filter(Boolean)
    .join(" ");

/** Execute actions; a failure on one issue is reported and the rest still run. */
export async function apply(L, actions, issueByKey, log = console.log) {
  let failed = 0;
  for (const a of actions) {
    const issue = issueByKey.get(a.key);
    try {
      if (a.state) await L.setState(issue, a.state);
      if (a.link) await L.link(issue, a.link);
      if (a.addLabel) await L.addLabel(issue, a.addLabel);
      if (a.removeLabel) await L.removeLabel(issue, a.removeLabel);
      if (a.comment) await L.comment(issue, `${a.comment}\n\n— ${MARK(a.tag)}`);
    } catch (e) {
      failed++;
      log(`  ! ${a.key}: ${e.message}`);
    }
  }
  return failed;
}

const RAW = `id identifier title url state{id name type} team{id} labels{nodes{id name}} comments(first:30){nodes{body}} attachments(first:20){nodes{url}}`;

async function fetchIssues(gql) {
  const out = [];
  let after = null;
  do {
    const d = await gql(
      `query($k:String!,$a:String){issues(first:50,after:$a,filter:{team:{key:{eq:$k}},state:{type:{nin:["completed","canceled","duplicate"]}}}){nodes{${RAW}} pageInfo{hasNextPage endCursor}}}`,
      { k: TEAM, a: after },
    );
    out.push(...d.issues.nodes);
    after = d.issues.pageInfo.hasNextPage ? d.issues.pageInfo.endCursor : null;
  } while (after);
  return out;
}

const sh = (cmd, args) =>
  execFileSync(cmd, args, { cwd: ROOT, encoding: "utf8", maxBuffer: 64 << 20 });
const prs = (state) =>
  JSON.parse(
    sh("gh", [
      "pr",
      "list",
      "-R",
      REPO,
      "--state",
      state,
      "--limit",
      "100",
      "--json",
      "number,url,title,headRefName,body,updatedAt,isCrossRepository",
    ]),
    // The repo is public: a fork PR saying "Fixes STA-n" must not drive Linear state as the app.
  ).filter((pr) => !pr.isCrossRepository);
function remoteBranches() {
  return sh("git", [
    "for-each-ref",
    "--format=%(refname:lstrip=3)\t%(committerdate:unix)",
    "refs/remotes/origin",
  ])
    .split("\n")
    .filter(Boolean)
    .map((l) => {
      const [name, t] = l.split("\t");
      return { name, at: Number(t) * 1000 };
    });
}

async function main(argv) {
  const dry = argv.includes("--dry-run");
  const c = client();
  if (!c.hasToken) {
    console.log("linear-reconcile: no LINEAR_AGENT_TOKEN or LINEAR_API_KEY; skipping");
    return 0;
  }
  const raw = await fetchIssues(c.gql);
  const issues = raw.map((i) => ({
    ...i,
    labels: i.labels.nodes.map((l) => l.name.toLowerCase()),
    comments: i.comments.nodes.map((n) => n.body),
    links: i.attachments.nodes.map((n) => n.url),
  }));
  const openPrs = prs("open");
  const branchList = remoteBranches();
  for (const pr of openPrs) branchList.push({ name: pr.headRefName, at: Date.parse(pr.updatedAt) });
  const adrs = adrStatuses(
    readdirSync(join(ROOT, ADR_DIR))
      .filter((f) => f.endsWith(".mdx"))
      .map((f) => [f, readFileSync(join(ROOT, ADR_DIR, f), "utf8")]),
  );
  const actions = plan({
    issues,
    openPrs,
    mergedPrs: prs("merged"),
    branches: branchList,
    adrs,
    now: Date.now(),
  });

  const L = linear(c, { dry, log: () => {} });
  const byKey = new Map(raw.map((i) => [i.identifier, i]));
  const failed = await apply(L, actions, byKey);

  const counts = Object.fromEntries(
    ["a", "b", "c", "d", "e"].map((r) => [r, actions.filter((a) => a.rule === r).length]),
  );
  const lines = [
    `## Linear reconcile${dry ? " (dry run)" : ""}`,
    `${issues.length} open ${TEAM} issues, ${openPrs.length} open PRs. ` +
      `Done ${counts.a}, In Review ${counts.b}, ADR closed ${counts.c}, stale ${counts.d}, ADR-accepted ${counts.e}` +
      (failed ? `, ${failed} failed` : ""),
    "",
    ...actions.map((a) => `- ${describe(a)}`),
  ];
  console.log(lines.join("\n"));
  if (process.env.GITHUB_STEP_SUMMARY)
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${lines.join("\n")}\n`);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  main(process.argv.slice(2)).then(
    (code) => process.exit(code),
    // Never blocks: a Linear or GitHub outage is reported, not failed.
    (e) => (console.log(`linear-reconcile: ${e.message}`), process.exit(0)),
  );
