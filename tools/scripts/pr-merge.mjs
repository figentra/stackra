#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: `pnpm pr:merge [-R owner/repo] <n>` (`-R figentra/os` for the OS repo) — the only way an agent merges (owner decision A1, ADR 0119). As
 *   `stackra-bot`, never `--admin`, it enqueues PR <n> in the base branch's merge queue (GraphQL `enqueuePullRequest`
 *   with `expectedHeadOid`, ADR 0166 CI3) or, when the repo has no queue (template, os), merges it with
 *   `--squash --delete-branch --match-head-commit <head>`; only when:
 *   1. the newest "Quality Gate" check run on the head SHA concluded `success`;
 *   2. the PR is open and not a draft;
 *   3. the AI review passed (ADR 0230): either the reviewer app passed the head on this base, or the owner approved.
 *      - Reviewer: a PR comment whose author is the App itself (`user.type` Bot and `performed_via_github_app.slug`
 *        `stackra-reviewer`, never a login string), unedited, first line `AI-REVIEW: PASS <40-hex sha> base=<base
 *        ref> [patch=<patch id>]`. The sha is the head, or an earlier head whose diff against the base has the same
 *        `git patch-id --verbatim` as the head's (ADR 0285: a clean rebase or update-branch keeps the verdict; any diff
 *        change, whitespace included, voids it). The patch id is recomputed from the sha; an unedited verdict's `patch=`
 *        is used only when that sha can no longer be read. A FAIL is read loosely: any first line starting `AI-REVIEW: FAIL` counts (short SHA, no SHA or trailing
 *        text), unless it names a 7+ hex SHA that is neither a prefix of the head nor of a same-patch earlier head. A FAIL for the head SHA is sticky: any counted FAIL beats every PASS, whatever its order. An edit to
 *        any reviewer comment voids every reviewer verdict posted before it. Never counted when the reviewer is the
 *        PR author or the head commit's author or committer.
 *      - Owner: an APPROVED pull request review by the owner user (`figentra-usr`) on the head SHA whose body ends
 *        with the token `owner-approval`. A comment never counts for the owner.
 *   4. a PR labelled `design` or `risk:R3` also has an owner APPROVED review on the head SHA, or `owner-approved`
 *      put there by the owner: the latest `labeled` / `unlabeled` issue event for it is a `labeled` whose actor is
 *      the owner user, never a bot (ADR 0293). The events are read only then; an API error refuses the merge.
 *   With a merge queue it enqueues only while `enqueueReady` holds (owner order OP7): bot-token.mjs keeps a 30 s
 *   connect timeout and retries (STA-302).
 * Network: gh reads retry on transient errors (bot-token.mjs); the merge or enqueue runs again after a transient
 *   failure only when a re-read shows the PR neither merged nor queued.
 * Convention: the reviewer posts `AI-REVIEW: PASS <full head sha> base=<base ref> patch=<patch id>` (or `FAIL <sha>`) as a new
 *   comment through `pnpm bot:review -- pr comment <n> --body-file <f>`, and never edits a verdict.
 * Exit: 0 merged or queued, 1 refused (reasons on stderr), 2 usage.
 * Secrets: the bot token stays in the gh child's environment.
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import * as botNetwork from "./bot-token.mjs";

export const OWNER = "figentra-usr";
export const REVIEWER = "stackra-reviewer";
const GATED_LABELS = ["design", "risk:R3"];
const VERDICT_LINE =
  /^AI-REVIEW:\s*(PASS|FAIL)\s+([0-9a-f]{40})(?:\s+base=(\S+))?(?:\s+patch=([0-9a-f]{40}))?\s*$/i;
const OWNER_TOKEN = /(?:^|\s)owner-approval\s*$/;
// N1 (#48): a FAIL is read loosely so a sloppy FAIL still blocks; only a hex token of 7+ that is not a prefix of the
// head marks it as a FAIL for an older commit, which a new commit clears.
// Markdown and wording around it do not matter: `**AI-REVIEW: FAIL**`, `AI-REVIEW: FAILED`, `> AI-REVIEW - fail`.
const LOOSE_FAIL = /^\W*AI-REVIEW\W*FAIL(?:ED)?\b\W*(\w*)/i;
const HEX_TOKEN = /^[0-9a-f]{7,40}$/i;
const failForHead = (token, sha, same) => {
  const t = token.toLowerCase();
  return !HEX_TOKEN.test(t) || sha.startsWith(t) || [...same].some((s) => s.startsWith(t));
};

/**
 * The `git patch-id --verbatim` of a unified diff, or null for an empty diff. Verbatim, not `--stable`: `--stable`
 * ignores whitespace, so a PASS would survive a re-indented YAML key or a split shell argument (ADR 0285).
 */
export function patchId(diff) {
  const r = spawnSync("git", ["patch-id", "--verbatim"], { input: diff, encoding: "utf8" });
  if (r.status !== 0) throw new Error(`git patch-id failed: ${r.stderr.trim()}`);
  return r.stdout.split(" ")[0] || null;
}

/**
 * The earlier head SHAs (full, or the 7+ hex a loose FAIL names) in reviewer-app verdicts whose diff has the head's
 * patch id. `patchOf(sha)` returns a commit's patch id against the base, or null when it cannot (the commit is gone);
 * only then is a `patch=` claim used, and only when every unedited verdict naming that SHA claims the same id.
 */
export function samePatchShas(pr, comments, patchOf) {
  const sha = pr.headRefOid;
  const claims = new Map();
  for (const c of comments.filter(byReviewerApp)) {
    const line = (c.body ?? "").trim().split("\n")[0].trim();
    const match = VERDICT_LINE.exec(line);
    const old = (match?.[2] ?? LOOSE_FAIL.exec(line)?.[1] ?? "").toLowerCase();
    if (!HEX_TOKEN.test(old) || sha.startsWith(old)) continue;
    const claim = c.updated_at === c.created_at ? match?.[4]?.toLowerCase() : undefined;
    claims.set(old, [...(claims.get(old) ?? []), claim].filter(Boolean));
  }
  const same = new Set();
  if (!claims.size) return same;
  const head = patchOf(sha);
  if (!head) return same;
  for (const [old, ids] of claims) {
    const claimed = new Set(ids).size === 1 ? ids[0] : null;
    if ((patchOf(old) ?? claimed) === head) same.add(old);
  }
  return same;
}

/**
 * OP7: the enqueue path is open only while the bot's network layer has a 30 s connect timeout and retries (STA-302),
 * declared as the `CONNECT_TIMEOUT_MS` and `RETRY_ATTEMPTS` exports of `bot-token.mjs`.
 */
export const enqueueReady = (network) =>
  network.CONNECT_TIMEOUT_MS >= 30_000 && network.RETRY_ATTEMPTS >= 2;

/** One login form for users and apps: `app/stackra-bot`, `stackra-bot[bot]` and `stackra-bot` are the same actor. */
export const actor = (login = "") =>
  login
    .replace(/^app\//, "")
    .replace(/\[bot\]$/, "")
    .toLowerCase();

/** A REST issue comment written by the reviewer App itself, not by an account that only shares its name. */
export const byReviewerApp = (c) =>
  c.user?.type === "Bot" && c.performed_via_github_app?.slug === REVIEWER;

/** The label that stands for the owner's yes on a gated PR; only the owner adds it (ADR 0230 rule 4). */
export const OWNER_LABEL = "owner-approved";
/**
 * True when the owner put `owner-approved` on the PR and nobody took it off since: the latest `labeled` /
 * `unlabeled` event for it (REST issue events) is a `labeled` by the owner user (`user.type` User, never a bot or
 * an app account). A label any other actor added never counts, whatever the PR's labels say.
 */
export function ownerLabelled(events) {
  const last = events
    .filter((e) => ["labeled", "unlabeled"].includes(e.event) && e.label?.name === OWNER_LABEL)
    .sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id - b.id)
    .at(-1);
  const who = last?.actor;
  return (
    last?.event === "labeled" &&
    who?.type === "User" &&
    who.login === OWNER &&
    !/\[bot\]$/i.test(who.login)
  );
}

/** A REST pull request review approving `sha` by the owner user with the `owner-approval` token. */
export const ownerApproves = (r, sha) =>
  r.user?.type === "User" &&
  r.user.login === OWNER &&
  r.state === "APPROVED" &&
  r.commit_id === sha &&
  OWNER_TOKEN.test((r.body ?? "").trim());

/**
 * The counted AI-REVIEW verdict for `pr` (REST issue `comments` and pull `reviews`), and why other verdicts were
 * ignored. `authors` holds the PR author and the head commit's author and committer: none may review their change.
 * `same` holds earlier head SHAs with the head's patch id (`samePatchShas`); their verdicts count as the head's.
 */
export function aiReview(pr, comments, reviews, authors = [], same = new Set()) {
  const sha = pr.headRefOid;
  const self = new Set(authors.filter(Boolean).map(actor));
  const ignored = [];
  const edits = comments
    .filter((c) => byReviewerApp(c) && c.updated_at !== c.created_at)
    .map((c) => c.updated_at)
    .sort();
  const voidBefore = edits.at(-1) ?? "";
  const verdicts = new Set();
  for (const c of comments) {
    const line = (c.body ?? "").trim().split("\n")[0].trim();
    const match = VERDICT_LINE.exec(line);
    const loose = match ? null : LOOSE_FAIL.exec(line);
    const named = match?.[2].toLowerCase();
    if (match ? named !== sha && !same.has(named) : !loose || !failForHead(loose[1], sha, same))
      continue;
    const who = c.user?.login ?? "unknown";
    const [, kind, , base] = match ?? [line, "FAIL"];
    if (!byReviewerApp(c)) ignored.push(`${who} is not the ${REVIEWER} app`);
    else if (self.has(actor(who))) ignored.push(`${who} authored this change and cannot review it`);
    else if (c.updated_at !== c.created_at) ignored.push(`a verdict by ${who} was edited`);
    else if (c.created_at < voidBefore)
      ignored.push(`a ${REVIEWER} comment was edited after this verdict; post a new one`);
    else if (kind.toUpperCase() === "PASS" && base !== pr.baseRefName)
      ignored.push(`a PASS names base ${base ?? "none"}, the PR targets ${pr.baseRefName}`);
    else verdicts.add(kind.toUpperCase());
  }
  const owner = !self.has(OWNER) && reviews.some((r) => ownerApproves(r, sha));
  const verdict = verdicts.has("FAIL") ? "FAIL" : verdicts.has("PASS") || owner ? "PASS" : null;
  return { verdict, ignored };
}

/**
 * Reasons the PR may not merge; empty means merge. `checkRuns` are the head SHA's "Quality Gate" runs; `comments`
 * and `reviews` are the REST issue comments and pull reviews; `same` is `samePatchShas`; `events` are the REST
 * issue events (`ownerLabelled`), empty when not read.
 */
export function blockers(
  pr,
  checkRuns,
  headCommit = {},
  comments = [],
  reviews = [],
  same = undefined,
  events = [],
) {
  const reasons = [];
  const sha = pr.headRefOid;
  if (pr.state !== "OPEN") reasons.push(`PR is ${pr.state}`);
  if (pr.isDraft) reasons.push("PR is a draft");

  const gate = [...checkRuns].sort((a, b) => b.id - a.id)[0];
  if (!gate) reasons.push(`no Quality Gate run on ${sha}`);
  else if (gate.conclusion !== "success")
    reasons.push(`Quality Gate on ${sha} is ${gate.conclusion ?? gate.status}`);

  const authors = [pr.author?.login, headCommit.author?.login, headCommit.committer?.login];
  const { verdict, ignored } = aiReview(pr, comments, reviews, authors, same);
  if (verdict !== "PASS")
    reasons.push(
      `no AI review PASS for ${sha} (counted verdict: ${verdict ?? "none"}) — the reviewer posts "AI-REVIEW: PASS ${sha} base=${pr.baseRefName}" with \`pnpm bot:review\`${ignored.length ? `; ignored: ${[...new Set(ignored)].join("; ")}` : ""}`,
    );

  const labels = pr.labels.map((l) => l.name);
  const gated = GATED_LABELS.filter((l) => labels.includes(l));
  const ownerApproved =
    (labels.includes(OWNER_LABEL) && ownerLabelled(events)) ||
    reviews.some(
      (r) =>
        r.user?.type === "User" &&
        r.user.login === OWNER &&
        r.state === "APPROVED" &&
        r.commit_id === sha,
    );
  if (gated.length && !ownerApproved)
    reasons.push(
      `labelled ${gated.join(", ")}: needs an owner approval on ${sha} or the ${OWNER_LABEL} label added by ${OWNER}${labels.includes(OWNER_LABEL) ? ` (the ${OWNER_LABEL} label on it was not added by ${OWNER}, or was removed since)` : ""}`,
    );
  return reasons;
}

/** `[-R|--repo owner/name] <n>` → the PR number and repo; `{owner}/{repo}` is gh's current-repo placeholder. */
export function parseArgs(argv) {
  const args = argv.filter((a) => a !== "--");
  let repo = "{owner}/{repo}";
  const rest = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "-R" || args[i] === "--repo") repo = args[++i] ?? "";
    else if (args[i].startsWith("--repo=")) repo = args[i].slice(7);
    else rest.push(args[i]);
  }
  const valid = repo === "{owner}/{repo}" || /^[\w.-]+\/[\w.-]+$/.test(repo);
  return rest.length === 1 && /^\d+$/.test(rest[0]) && valid ? { n: rest[0], repo } : null;
}

/** gh's stdout. Only a call marked `idempotent` (a read) is retried on a transient error; a write runs once. */
export function gh(args, token, idempotent = false) {
  // 256 MiB: a compare diff with lockfile churn passes 1 MiB, and a cut-off diff would void rebase survival.
  const options = {
    encoding: "utf8",
    env: { ...process.env, GH_TOKEN: token },
    maxBuffer: 256 * 1024 * 1024,
  };
  const r = idempotent
    ? botNetwork.spawnRetrying("gh", args, options)
    : spawnSync("gh", args, options);
  if (r.error) throw new Error(`gh ${args[0]} ${args[1]} failed: ${r.error.message}`);
  if (r.status !== 0) throw new Error(`gh ${args[0]} ${args[1]} failed: ${r.stderr.trim()}`);
  return r.stdout;
}

/** A GraphQL call's data. A query is retried on a transient error, a mutation never: the document says which. */
export const graphql = (query, fields, token) =>
  JSON.parse(
    gh(
      ["api", "graphql", "-f", `query=${query}`, ...fields],
      token,
      botNetwork.isGraphqlRead(query),
    ),
  ).data;

/** Every page of a REST list endpoint, as one array. */
const list = (path, token) =>
  JSON.parse(gh(["api", "--paginate", "--slurp", path], token, true)).flat();

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const parsed = parseArgs(process.argv.slice(2));
  if (!parsed) {
    process.stderr.write("usage: pnpm pr:merge [-R owner/repo] <pr-number>\n");
    process.exit(2);
  }
  const { n, repo } = parsed;
  const R = repo.startsWith("{") ? [] : ["-R", repo];
  try {
    const token = await botNetwork.mintToken();
    const fields = "number,state,isDraft,headRefOid,baseRefName,labels,author";
    const pr = JSON.parse(gh(["pr", "view", n, ...R, "--json", fields], token, true));
    const runs = JSON.parse(
      gh(
        ["api", `repos/${repo}/commits/${pr.headRefOid}/check-runs?check_name=Quality%20Gate`],
        token,
        true,
      ),
    ).check_runs;
    // The head commit's GitHub author and committer (null when the email maps to no account).
    const headCommit = JSON.parse(
      gh(
        ["api", `repos/${repo}/commits/${pr.headRefOid}`, "--jq", "{author,committer}"],
        token,
        true,
      ),
    );
    // REST, not `gh pr view`: only REST carries user.type, performed_via_github_app and updated_at.
    const comments = list(`repos/${repo}/issues/${n}/comments?per_page=100`, token);
    const reviews = list(`repos/${repo}/pulls/${n}/reviews?per_page=100`, token);
    // A commit's PR diff is its diff from the merge base with the base branch, as the compare API gives it.
    const patchOf = (commit) => {
      try {
        const diff = gh(
          [
            "api",
            "-H",
            "Accept: application/vnd.github.diff",
            `repos/${repo}/compare/${pr.baseRefName}...${commit}`,
          ],
          token,
          true,
        );
        return patchId(diff);
      } catch (error) {
        // Fails closed: verdicts for an earlier head do not carry over, so the PR needs a fresh review.
        process.stderr.write(`pr-merge: no patch id for ${commit} (${error.message})\n`);
        return null;
      }
    };
    const same = samePatchShas(pr, comments, patchOf);
    // Who added owner-approved: read only when it decides the merge; `list` throws (refuse) on an API error.
    const labels = pr.labels.map((l) => l.name);
    const events =
      labels.includes(OWNER_LABEL) && GATED_LABELS.some((l) => labels.includes(l))
        ? list(`repos/${repo}/issues/${n}/events?per_page=100`, token)
        : [];
    const reasons = blockers(pr, runs, headCommit, comments, reviews, same, events);
    if (reasons.length) {
      process.stderr.write(
        `pr-merge: not merging #${n}:\n${reasons.map((r) => `  - ${r}`).join("\n")}\n`,
      );
      process.exit(1);
    }
    const [owner, name] = repo.startsWith("{") ? ["{owner}", "{repo}"] : repo.split("/");
    // -F (typed) fills gh's {owner}/{repo} placeholders and makes n an Int.
    const where = ["-F", `o=${owner}`, "-F", `r=${name}`, "-F", `n=${n}`];
    const { repository } = graphql(
      "query($o:String!,$r:String!,$n:Int!,$b:String!){repository(owner:$o,name:$r){" +
        "mergeQueue(branch:$b){id} pullRequest(number:$n){id}}}",
      [...where, "-f", `b=${pr.baseRefName}`],
      token,
    );
    if (repository.mergeQueue && !enqueueReady(botNetwork)) {
      throw new Error(
        `${pr.baseRefName} has a merge queue, but enqueueing needs CONNECT_TIMEOUT_MS >= 30000 and ` +
          "RETRY_ATTEMPTS >= 2 in bot-token.mjs (owner order OP7, STA-302); without undici the timeout is " +
          "10 s: run `pnpm install`",
      );
    }
    if (repository.mergeQueue) {
      // The queue squashes and deletes the branch (ruleset merge method, delete_branch_on_merge).
      const queued = () => {
        const { pullRequest } = graphql(
          "query($o:String!,$r:String!,$n:Int!){repository(owner:$o,name:$r){" +
            "pullRequest(number:$n){state mergeQueueEntry{id}}}}",
          where,
          token,
        ).repository;
        return Boolean(pullRequest.mergeQueueEntry) || pullRequest.state === "MERGED";
      };
      const entry = await botNetwork.retryUnlessLanded(
        () =>
          graphql(
            "mutation($id:ID!,$h:GitObjectID!){enqueuePullRequest(input:" +
              "{pullRequestId:$id,expectedHeadOid:$h}){mergeQueueEntry{position state}}}",
            ["-f", `id=${repository.pullRequest.id}`, "-f", `h=${pr.headRefOid}`],
            token,
          ).enqueuePullRequest.mergeQueueEntry,
        queued,
      );
      const place = entry
        ? `position ${entry.position}, ${entry.state}`
        : "landed before a transient error";
      process.stdout.write(`queued #${n} at ${pr.headRefOid}: ${place}\n`);
    } else {
      const merged = () =>
        JSON.parse(gh(["pr", "view", n, ...R, "--json", "state"], token, true)).state === "MERGED";
      const merge = ["pr", "merge", n, ...R, "--squash", "--delete-branch"];
      await botNetwork.retryUnlessLanded(
        () => gh([...merge, "--match-head-commit", pr.headRefOid], token),
        merged,
      );
      process.stdout.write(`merged #${n} at ${pr.headRefOid}\n`);
    }
  } catch (error) {
    process.stderr.write(`pr-merge: ${error.message}\n`);
    process.exit(1);
  }
}
