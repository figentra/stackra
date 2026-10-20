#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: `pnpm pr:merge <n>` — the only way an agent merges (owner decision A1, ADR 0119). Merges PR <n> as
 *   `stackra-bot` with `--squash --delete-branch --match-head-commit <head>` (never `--admin`) only when:
 *   1. the newest "Quality Gate" check run on the head SHA concluded `success`;
 *   2. the PR is open and not a draft;
 *   3. the newest counted `AI-REVIEW: <PASS|FAIL> <sha>` comment for the head SHA says PASS (ADR 0230). A verdict
 *      counts only when its author is the reviewer app (`stackra-reviewer`), or the owner with the explicit
 *      `owner-approval` token on the verdict line, and never when its author is the PR author or the head commit's
 *      author or committer. The builder app `stackra-bot` cannot review: it writes the code;
 *   4. a PR labelled `design` or `risk:R3` also has an owner APPROVED review on the head SHA, or `owner-approved`.
 * Convention: a reviewer posts `AI-REVIEW: PASS <full head sha>` (or FAIL) on the comment's first line through
 *   `pnpm bot:review -- pr comment <n> --body-file <f>`. The owner approving by hand writes
 *   `AI-REVIEW: PASS <sha> owner-approval`. A label cannot name a SHA, so review results are comments only.
 * Exit: 0 merged, 1 refused (reasons on stderr), 2 usage.
 * Secrets: the bot token stays in the gh child's environment.
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { mintToken } from "./bot-token.mjs";

export const OWNER = "figentra-usr";
export const REVIEWER = "stackra-reviewer";
const GATED_LABELS = ["design", "risk:R3"];
const REVIEW_LINE = /^AI-REVIEW:\s*(PASS|FAIL)\s+([0-9a-f]{7,40})\b([^\n]*)/i;

/** One login form for users and apps: `app/stackra-bot`, `stackra-bot[bot]` and `stackra-bot` are the same actor. */
export const actor = (login = "") =>
  login
    .replace(/^app\//, "")
    .replace(/\[bot\]$/, "")
    .toLowerCase();

/**
 * The newest counted AI-REVIEW verdict for `sha`, and why other verdicts for it were ignored. `authors` holds the
 * PR author and the head commit's author and committer logins: none of them may review their own change.
 */
export function aiReview(comments, sha, authors = []) {
  const self = new Set(authors.filter(Boolean).map(actor));
  let verdict = null;
  const ignored = [];
  for (const c of [...comments].sort((a, b) => a.createdAt.localeCompare(b.createdAt))) {
    const match = REVIEW_LINE.exec(c.body.trim());
    if (!match || !sha.startsWith(match[2].toLowerCase())) continue;
    const who = actor(c.author?.login);
    const ownerApproval = who === OWNER && /\bowner-approval\b/i.test(match[3]);
    if (self.has(who)) ignored.push(`${who} authored this change and cannot review it`);
    else if (who !== REVIEWER && !ownerApproval)
      ignored.push(
        who === OWNER
          ? `${who} is the owner account; its verdict counts only with \`owner-approval\` on the line`
          : `${who} is not the reviewer identity (${REVIEWER})`,
      );
    else verdict = match[1].toUpperCase();
  }
  return { verdict, ignored };
}

/** Reasons the PR may not merge; empty means merge. `checkRuns` are the head SHA's "Quality Gate" runs. */
export function blockers(pr, checkRuns, headCommit = {}) {
  const reasons = [];
  const sha = pr.headRefOid;
  if (pr.state !== "OPEN") reasons.push(`PR is ${pr.state}`);
  if (pr.isDraft) reasons.push("PR is a draft");

  const gate = [...checkRuns].sort((a, b) => b.id - a.id)[0];
  if (!gate) reasons.push(`no Quality Gate run on ${sha}`);
  else if (gate.conclusion !== "success")
    reasons.push(`Quality Gate on ${sha} is ${gate.conclusion ?? gate.status}`);

  const authors = [pr.author?.login, headCommit.author?.login, headCommit.committer?.login];
  const { verdict, ignored } = aiReview(pr.comments, sha, authors);
  if (verdict !== "PASS")
    reasons.push(
      `no AI review PASS for ${sha} (newest counted verdict: ${verdict ?? "none"}) — the reviewer posts "AI-REVIEW: PASS ${sha}" with \`pnpm bot:review\`${ignored.length ? `; ignored: ${[...new Set(ignored)].join("; ")}` : ""}`,
    );

  const labels = pr.labels.map((l) => l.name);
  const gated = GATED_LABELS.filter((l) => labels.includes(l));
  const ownerApproved =
    labels.includes("owner-approved") ||
    pr.reviews.some(
      (r) => r.author?.login === OWNER && r.state === "APPROVED" && r.commit?.oid === sha,
    );
  if (gated.length && !ownerApproved)
    reasons.push(
      `labelled ${gated.join(", ")}: needs an owner approval on ${sha} or the owner-approved label`,
    );
  return reasons;
}

function gh(args, token) {
  const r = spawnSync("gh", args, { encoding: "utf8", env: { ...process.env, GH_TOKEN: token } });
  if (r.status !== 0) throw new Error(`gh ${args[0]} ${args[1]} failed: ${r.stderr.trim()}`);
  return r.stdout;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const n = process.argv.slice(2).find((a) => a !== "--");
  if (!/^\d+$/.test(n ?? "")) {
    process.stderr.write("usage: pnpm pr:merge <pr-number>\n");
    process.exit(2);
  }
  try {
    const token = await mintToken();
    const fields = "number,state,isDraft,headRefOid,labels,comments,reviews,author";
    const pr = JSON.parse(gh(["pr", "view", n, "--json", fields], token));
    const runs = JSON.parse(
      gh(
        [
          "api",
          `repos/{owner}/{repo}/commits/${pr.headRefOid}/check-runs?check_name=Quality%20Gate`,
        ],
        token,
      ),
    ).check_runs;
    // The head commit's GitHub author and committer (null when the email maps to no account).
    const headCommit = JSON.parse(
      gh(
        ["api", `repos/{owner}/{repo}/commits/${pr.headRefOid}`, "--jq", "{author,committer}"],
        token,
      ),
    );
    const reasons = blockers(pr, runs, headCommit);
    if (reasons.length) {
      process.stderr.write(
        `pr-merge: not merging #${n}:\n${reasons.map((r) => `  - ${r}`).join("\n")}\n`,
      );
      process.exit(1);
    }
    gh(
      ["pr", "merge", n, "--squash", "--delete-branch", "--match-head-commit", pr.headRefOid],
      token,
    );
    process.stdout.write(`merged #${n} at ${pr.headRefOid}\n`);
  } catch (error) {
    process.stderr.write(`pr-merge: ${error.message}\n`);
    process.exit(1);
  }
}
