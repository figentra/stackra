#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: `pnpm pr:merge [-R owner/repo] <n>` (`-R figentra/os` for the OS repo) — the only way an agent merges (owner decision A1, ADR 0119). Merges PR <n> as
 *   `stackra-bot` with `--squash --delete-branch --match-head-commit <head>` (never `--admin`) only when:
 *   1. the newest "Quality Gate" check run on the head SHA concluded `success`;
 *   2. the PR is open and not a draft;
 *   3. the AI review passed (ADR 0230): either the reviewer app passed the head on this base, or the owner approved.
 *      - Reviewer: a PR comment whose author is the App itself (`user.type` Bot and `performed_via_github_app.slug`
 *        `stackra-reviewer`, never a login string), unedited, first line `AI-REVIEW: PASS <40-hex head> base=<base
 *        ref>`. A FAIL is read loosely: any first line starting `AI-REVIEW: FAIL` counts (short SHA, no SHA or trailing
 *        text), unless it names a 7+ hex SHA that is not the head's. A FAIL for the head SHA is sticky: any counted FAIL beats every PASS, whatever its order. An edit to
 *        any reviewer comment voids every reviewer verdict posted before it. Never counted when the reviewer is the
 *        PR author or the head commit's author or committer.
 *      - Owner: an APPROVED pull request review by the owner user (`figentra-usr`) on the head SHA whose body ends
 *        with the token `owner-approval`. A comment never counts for the owner.
 *   4. a PR labelled `design` or `risk:R3` also has an owner APPROVED review on the head SHA, or `owner-approved`.
 * Convention: the reviewer posts `AI-REVIEW: PASS <full head sha> base=<base ref>` (or `FAIL <sha>`) as a new
 *   comment through `pnpm bot:review -- pr comment <n> --body-file <f>`, and never edits a verdict.
 * Exit: 0 merged, 1 refused (reasons on stderr), 2 usage.
 * Secrets: the bot token stays in the gh child's environment.
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { mintToken } from "./bot-token.mjs";

export const OWNER = "figentra-usr";
export const REVIEWER = "stackra-reviewer";
const GATED_LABELS = ["design", "risk:R3"];
const VERDICT_LINE = /^AI-REVIEW:\s*(PASS|FAIL)\s+([0-9a-f]{40})(?:\s+base=(\S+))?\s*$/i;
const OWNER_TOKEN = /(?:^|\s)owner-approval\s*$/;
// N1 (#48): a FAIL is read loosely so a sloppy FAIL still blocks; only a hex token of 7+ that is not a prefix of the
// head marks it as a FAIL for an older commit, which a new commit clears.
const LOOSE_FAIL = /^AI-REVIEW:\s*FAIL\b\s*(\S*)/i;
const failForHead = (token, sha) =>
  !/^[0-9a-f]{7,40}$/i.test(token) || sha.startsWith(token.toLowerCase());

/** One login form for users and apps: `app/stackra-bot`, `stackra-bot[bot]` and `stackra-bot` are the same actor. */
export const actor = (login = "") =>
  login
    .replace(/^app\//, "")
    .replace(/\[bot\]$/, "")
    .toLowerCase();

/** A REST issue comment written by the reviewer App itself, not by an account that only shares its name. */
export const byReviewerApp = (c) =>
  c.user?.type === "Bot" && c.performed_via_github_app?.slug === REVIEWER;

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
 */
export function aiReview(pr, comments, reviews, authors = []) {
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
    if (match ? match[2].toLowerCase() !== sha : !loose || !failForHead(loose[1], sha)) continue;
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
 * and `reviews` are the REST issue comments and pull reviews.
 */
export function blockers(pr, checkRuns, headCommit = {}, comments = [], reviews = []) {
  const reasons = [];
  const sha = pr.headRefOid;
  if (pr.state !== "OPEN") reasons.push(`PR is ${pr.state}`);
  if (pr.isDraft) reasons.push("PR is a draft");

  const gate = [...checkRuns].sort((a, b) => b.id - a.id)[0];
  if (!gate) reasons.push(`no Quality Gate run on ${sha}`);
  else if (gate.conclusion !== "success")
    reasons.push(`Quality Gate on ${sha} is ${gate.conclusion ?? gate.status}`);

  const authors = [pr.author?.login, headCommit.author?.login, headCommit.committer?.login];
  const { verdict, ignored } = aiReview(pr, comments, reviews, authors);
  if (verdict !== "PASS")
    reasons.push(
      `no AI review PASS for ${sha} (counted verdict: ${verdict ?? "none"}) — the reviewer posts "AI-REVIEW: PASS ${sha} base=${pr.baseRefName}" with \`pnpm bot:review\`${ignored.length ? `; ignored: ${[...new Set(ignored)].join("; ")}` : ""}`,
    );

  const labels = pr.labels.map((l) => l.name);
  const gated = GATED_LABELS.filter((l) => labels.includes(l));
  const ownerApproved =
    labels.includes("owner-approved") ||
    reviews.some(
      (r) =>
        r.user?.type === "User" &&
        r.user.login === OWNER &&
        r.state === "APPROVED" &&
        r.commit_id === sha,
    );
  if (gated.length && !ownerApproved)
    reasons.push(
      `labelled ${gated.join(", ")}: needs an owner approval on ${sha} or the owner-approved label`,
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

function gh(args, token) {
  const r = spawnSync("gh", args, { encoding: "utf8", env: { ...process.env, GH_TOKEN: token } });
  if (r.status !== 0) throw new Error(`gh ${args[0]} ${args[1]} failed: ${r.stderr.trim()}`);
  return r.stdout;
}

/** Every page of a REST list endpoint, as one array. */
const list = (path, token) => JSON.parse(gh(["api", "--paginate", "--slurp", path], token)).flat();

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const parsed = parseArgs(process.argv.slice(2));
  if (!parsed) {
    process.stderr.write("usage: pnpm pr:merge [-R owner/repo] <pr-number>\n");
    process.exit(2);
  }
  const { n, repo } = parsed;
  const R = repo.startsWith("{") ? [] : ["-R", repo];
  try {
    const token = await mintToken();
    const fields = "number,state,isDraft,headRefOid,baseRefName,labels,author";
    const pr = JSON.parse(gh(["pr", "view", n, ...R, "--json", fields], token));
    const runs = JSON.parse(
      gh(
        ["api", `repos/${repo}/commits/${pr.headRefOid}/check-runs?check_name=Quality%20Gate`],
        token,
      ),
    ).check_runs;
    // The head commit's GitHub author and committer (null when the email maps to no account).
    const headCommit = JSON.parse(
      gh(["api", `repos/${repo}/commits/${pr.headRefOid}`, "--jq", "{author,committer}"], token),
    );
    // REST, not `gh pr view`: only REST carries user.type, performed_via_github_app and updated_at.
    const comments = list(`repos/${repo}/issues/${n}/comments?per_page=100`, token);
    const reviews = list(`repos/${repo}/pulls/${n}/reviews?per_page=100`, token);
    const reasons = blockers(pr, runs, headCommit, comments, reviews);
    if (reasons.length) {
      process.stderr.write(
        `pr-merge: not merging #${n}:\n${reasons.map((r) => `  - ${r}`).join("\n")}\n`,
      );
      process.exit(1);
    }
    gh(
      ["pr", "merge", n, ...R, "--squash", "--delete-branch", "--match-head-commit", pr.headRefOid],
      token,
    );
    process.stdout.write(`merged #${n} at ${pr.headRefOid}\n`);
  } catch (error) {
    process.stderr.write(`pr-merge: ${error.message}\n`);
    process.exit(1);
  }
}
