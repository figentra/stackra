#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: `pnpm pr:merge <n>` — the only way an agent merges (owner decision A1, ADR 0119). Merges PR <n> as
 *   `stackra-bot` with `--squash --delete-branch --match-head-commit <head>` (never `--admin`) only when:
 *   1. the newest "Quality Gate" check run on the head SHA concluded `success`;
 *   2. the PR is open and not a draft;
 *   3. the newest `AI-REVIEW: <PASS|FAIL> <sha>` comment for the head SHA, by the bot or the owner, says PASS;
 *   4. a PR labelled `design` or `risk:R3` also has an owner APPROVED review on the head SHA, or `owner-approved`.
 * Convention: an AI review ends by commenting `AI-REVIEW: PASS <full head sha>` (or FAIL) on its own first line.
 *   A label cannot name a SHA, so review results are comments only.
 * Exit: 0 merged, 1 refused (reasons on stderr), 2 usage.
 * Secrets: the bot token stays in the gh child's environment.
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { mintToken } from "./bot-token.mjs";

export const OWNER = "figentra-usr";
const TRUSTED = new Set([OWNER, "stackra-bot", "stackra-bot[bot]"]);
const GATED_LABELS = ["design", "risk:R3"];
const REVIEW_LINE = /^AI-REVIEW:\s*(PASS|FAIL)\s+([0-9a-f]{7,40})\b/i;

/** Verdict of the newest trusted AI-REVIEW comment for `sha`, or null. */
export function aiReview(comments, sha) {
  let verdict = null;
  for (const c of [...comments].sort((a, b) => a.createdAt.localeCompare(b.createdAt))) {
    const match = REVIEW_LINE.exec(c.body.trim());
    if (match && TRUSTED.has(c.author?.login) && sha.startsWith(match[2].toLowerCase()))
      verdict = match[1].toUpperCase();
  }
  return verdict;
}

/** Reasons the PR may not merge; empty means merge. `checkRuns` are the head SHA's "Quality Gate" runs. */
export function blockers(pr, checkRuns) {
  const reasons = [];
  const sha = pr.headRefOid;
  if (pr.state !== "OPEN") reasons.push(`PR is ${pr.state}`);
  if (pr.isDraft) reasons.push("PR is a draft");

  const gate = [...checkRuns].sort((a, b) => b.id - a.id)[0];
  if (!gate) reasons.push(`no Quality Gate run on ${sha}`);
  else if (gate.conclusion !== "success")
    reasons.push(`Quality Gate on ${sha} is ${gate.conclusion ?? gate.status}`);

  const verdict = aiReview(pr.comments, sha);
  if (verdict !== "PASS")
    reasons.push(
      `no AI review PASS for ${sha} (newest verdict: ${verdict ?? "none"}) — comment "AI-REVIEW: PASS ${sha}"`,
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
    const fields = "number,state,isDraft,headRefOid,labels,comments,reviews";
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
    const reasons = blockers(pr, runs);
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
