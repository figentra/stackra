#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: bring Linear team STA back in line with GitHub and the ADRs (ADR 0065 rule 7: a separate, non-blocking job).
 *   (a) issues referenced by merged work in any figentra repo → Done   (b) issues with an open PR → In Review
 *   (c) "Decide ADR NNNN" closed once ADR NNNN is Accepted/Superseded
 *   (d) In Progress with no branch/PR activity for 3 days → `stale` label + comment (label removed when active again)
 *   (e) Backlog/Todo issues whose title names an ADR that is now Accepted → comment
 *   (f) summary to stdout and $GITHUB_STEP_SUMMARY
 * Boundary: reads GitHub, git refs and the ADRs; writes only Linear states, labels and marked comments, never a repo
 *           file.
 * Runtime: node
 * Governing contract: ADR 0065 (rule 7: Linear sync never blocks); ADR 0121 (SDLC tooling roles and Linear).
 * Idempotent: every comment carries a `linear-reconcile (<tag>)` marker and an action whose marker is already on the
 * issue is skipped, so a human who reopens an issue is not overridden. `--dry-run` writes nothing.
 * Inputs: for every repo in linear-reconcile.repos.yaml (or `--repos a,b`): `gh pr list` (merged since `--since`,
 *   default 14 days back, and open) and `gh api …/commits?sha=main` (their `Refs:`/`Fixes:` trailers), each capped at
 *   `--max-pages` pages of 100 (GH_TOKEN in CI); `git for-each-ref refs/remotes/origin`, apps/docs/src/docs/adr/*.mdx.
 *   A repo the token cannot read is reported and skipped, never failed.
 * Secrets: LINEAR_AGENT_TOKEN or LINEAR_API_KEY from the environment only (see linear.mjs); never printed.
 */
import { execFileSync } from "node:child_process";
import { appendFileSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parse as parseYaml } from "yaml";
import { client, linear, TEAM } from "./linear.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const REPO = "figentra/stackra";
const CORE = REPO.split("/")[1];
const LOOKBACK_DAYS = 14;
const ADR_DIR = "apps/docs/src/docs/adr";
const STALE_MS = 3 * 24 * 3600 * 1000;
const MARK = (tag) => `linear-reconcile (${tag})`;

const keysIn = (s) => [...(s ?? "").matchAll(/\bSTA-(\d+)\b/gi)].map((m) => `STA-${m[1]}`);
/** Keys after a magic word, including lists: `Fixes STA-1, STA-2 and STA-3`. */
const keysAfter = (body, words) =>
  [
    ...(body ?? "").matchAll(
      new RegExp(`\\b(?:${words}):?\\s*(STA-\\d+(?:\\s*(?:,|and|&)?\\s*STA-\\d+)*)`, "gi"),
    ),
  ].flatMap((m) => keysIn(m[1]));

/**
 * STA keys merged work references. `closes` (merge → Done): the branch name, the title and Refs/Fixes/Closes/Resolves
 * lines; every feat/fix commit carries `Refs: STA-n` (commitlint `refs-issue-key`). `mentions` (open → In Review):
 * those plus Part of/Linear lines. `Part of STA-n` is how partial work avoids closing its issue.
 */
export function prKeys({ title = "", headRefName = "", body = "" }) {
  const closes = new Set([
    ...keysIn(headRefName),
    ...keysIn(title),
    ...keysAfter(body, "Fixes|Closes|Resolves|Refs"),
  ]);
  const mentions = new Set([...closes, ...keysAfter(body, "Part of|Linear")]);
  return { closes: [...closes], mentions: [...mentions] };
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
 * pr: { number, url, title, headRefName, body, updatedAt, ref? } — a commit on main is the same shape with its
 * message as `body`; `ref` names it in marker tags (`#12` in the core repo, `billing#12`, `billing@abc1234`).
 * branches: [{ name, at: ms }].
 */
const refs = (prs, kind) => {
  const m = new Map();
  for (const pr of prs) for (const k of prKeys(pr)[kind]) m.set(k, [...(m.get(k) ?? []), pr]);
  return m;
};
const refOf = (pr) => pr.ref ?? `#${pr.number}`;
const day = (ms) => new Date(ms).toISOString().slice(0, 10);

export function plan({ issues, mergedPrs, openPrs, branches, adrs, now }) {
  const actions = [];
  const open = refs(openPrs, "mentions");
  const merged = refs(mergedPrs, "closes");
  const act = (issue, rule, a) => actions.push({ key: issue.identifier, rule, ...a });

  for (const issue of issues) {
    const { name, type } = issue.state;
    // An open PR also counts when its URL is attached to the issue (the GitHub integration or `pnpm linear link`).
    // Merged PRs close an issue only through a closing reference, never through an attachment or a mention.
    const attached = openPrs.filter((pr) => issue.links?.includes(pr.url));
    const prsOpen = open.get(issue.identifier) ?? (attached.length ? attached : undefined);
    const prsMerged = merged.get(issue.identifier);

    // (b) before (a): an issue with any PR still open is not finished.
    if (prsOpen) {
      const pr = prsOpen[0];
      const tag = `review:${refOf(pr)}`;
      if (name !== "In Review" && !hasMark(issue, tag))
        act(issue, "b", { state: "In Review", link: pr.url, comment: `In review: ${pr.url}`, tag });
      continue;
    }
    if (prsMerged) {
      const pr = prsMerged[0];
      // Any merged item's marker means a human reopened the issue after a run; the next item must not override them.
      if (!prsMerged.some((p) => hasMark(issue, `done:${refOf(p)}`)))
        act(issue, "a", {
          state: "Done",
          link: pr.url,
          comment: `Merged: ${pr.url}`,
          tag: `done:${refOf(pr)}`,
        });
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
      // An issue started recently is not stale just because nothing is pushed yet.
      const started = Date.parse(issue.startedAt ?? "") || 0;
      const last = Math.max(started, ...times);
      const stale = now - last > STALE_MS;
      const labelled = issue.labels.includes("stale");
      // Tagged by the last activity: a human who removes the label is not overridden until new activity goes stale.
      const tag = `stale:${day(last)}`;
      if (stale && !labelled && !hasMark(issue, tag))
        act(issue, "d", {
          addLabel: "stale",
          comment: times.length
            ? `No branch or PR activity since ${day(last)}. Push, open a PR, or move it back.`
            : "In Progress with no linked branch or PR. Push a branch named after the issue, or move it back.",
          tag,
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
      // The GitHub integration usually attached the PR already, and Linear refuses a duplicate: the marker
      // comment below must still be written, or a later run would override a human.
      if (a.link && !issue.attachments?.nodes?.some((n) => n.url === a.link))
        await L.link(issue, a.link).catch((error) =>
          log(`  (${a.key}: attachment skipped: ${error.message})`),
        );
      if (a.addLabel) await L.addLabel(issue, a.addLabel);
      if (a.removeLabel) await L.removeLabel(issue, a.removeLabel);
      if (a.comment) await L.comment(issue, `${a.comment}\n\n— ${MARK(a.tag)}`);
    } catch (error) {
      failed++;
      log(`  ! ${a.key}: ${error.message}`);
    }
  }
  return failed;
}

// shortcut: the newest 100 comments and 50 attachments per issue; a busier issue can miss an old marker, page if that happens.
const RAW = `id identifier title url startedAt state{id name type} team{id} labels{nodes{id name}} comments(first:100,orderBy:createdAt){nodes{body}} attachments(first:50){nodes{url}}`;

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
const PR_FIELDS = "number,url,title,headRefName,body,updatedAt,isCrossRepository";

/**
 * Merged and open PRs, and commits on main, of every repo since `since` (YYYY-MM-DD), each read capped at `maxPages`
 * pages of 100. `gh(args)` runs gh and returns its parsed JSON (injected by tests). Merged PRs come before commits,
 * so an issue links its PR when both reference it. A repo that fails any read is skipped whole and reported.
 */
export function gather({ org, repos, since, maxPages, gh }) {
  const out = { mergedPrs: [], openPrs: [], skipped: [] };
  for (const repo of repos) {
    const full = `${org}/${repo}`;
    const ref = (s) => (repo === CORE ? s : `${repo}${s}`);
    try {
      const list = (...filter) =>
        gh([
          "pr",
          "list",
          "-R",
          full,
          ...filter,
          "--limit",
          String(maxPages * 100),
          "--json",
          PR_FIELDS,
        ])
          // The repos are public: a fork PR saying "Fixes STA-n" must not drive Linear state as the app.
          .filter((pr) => !pr.isCrossRepository)
          .map((pr) => ({ ...pr, ref: ref(`#${pr.number}`) }));
      const open = list("--state", "open");
      const merged = list("--state", "merged", "--search", `merged:>=${since}`);
      const commits = [];
      for (let page = 1; page <= maxPages; page++) {
        const batch = gh([
          "api",
          `repos/${full}/commits?sha=main&since=${since}T00:00:00Z&per_page=100&page=${page}`,
        ]);
        for (const c of batch)
          commits.push({
            ref: ref(`@${c.sha.slice(0, 7)}`),
            url: c.html_url,
            body: c.commit.message,
          });
        if (batch.length < 100) break;
      }
      out.openPrs.push(...open);
      out.mergedPrs.push(...merged, ...commits);
    } catch (error) {
      out.skipped.push(`${full}: ${String(error.message).split("\n")[0]}`);
    }
  }
  return out;
}

/** The repo list: `--repos a,b` or linear-reconcile.repos.yaml beside this script. */
export function readRepos(argv, text) {
  const { org, repos } = parseYaml(text);
  const cli = flag(argv, "repos");
  return { org, repos: cli ? cli.split(",").filter(Boolean) : repos };
}

const flag = (argv, name) => {
  const i = argv.findIndex((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (i < 0) return undefined;
  return argv[i].includes("=") ? argv[i].slice(argv[i].indexOf("=") + 1) : argv[i + 1];
};

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
  const { org, repos } = readRepos(
    argv,
    readFileSync(join(ROOT, "tools/scripts/linear-reconcile.repos.yaml"), "utf8"),
  );
  const since = flag(argv, "since") ?? day(Date.now() - LOOKBACK_DAYS * 24 * 3600 * 1000);
  const maxPages = Number(flag(argv, "max-pages") ?? 5);
  const { mergedPrs, openPrs, skipped } = gather({
    org,
    repos,
    since,
    maxPages,
    gh: (args) => JSON.parse(sh("gh", args)),
  });
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
    mergedPrs,
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
    `${issues.length} open ${TEAM} issues; ${repos.length - skipped.length}/${repos.length} repos since ${since}: ` +
      `${openPrs.length} open PRs, ${mergedPrs.length} merged PRs and main commits. ` +
      `Done ${counts.a}, In Review ${counts.b}, ADR closed ${counts.c}, stale ${counts.d}, ADR-accepted ${counts.e}` +
      (failed ? `, ${failed} failed` : ""),
    ...(skipped.length
      ? ["", "Skipped (the token cannot read them):", ...skipped.map((s) => `- ${s}`)]
      : []),
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
    (error) => {
      console.log(`linear-reconcile: ${error.message}`);
      process.exit(0);
    },
  );
