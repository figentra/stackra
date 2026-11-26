#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: `pnpm pr:merge [-R owner/repo] <n>` (`-R figentra/os` for the OS repo) — the only way an agent merges (owner decision A1, ADR 0119). As
 *   `stackra-bot`, never `--admin`, it enqueues PR <n> in the base branch's merge queue (GraphQL `enqueuePullRequest`
 *   with `expectedHeadOid`, ADR 0166 CI3) or, when the repo has no queue (template, os), merges it with
 *   `--squash --delete-branch --match-head-commit <head>`. The gate and the ruleset are the merge condition since
 *   ADR 0523 (decision 3): it merges only when
 *   1. the PR is open and not a draft;
 *   2. the newest "Quality Gate" check run on the head SHA concluded `success`;
 *   3. the ruleset lets it merge: the base has a merge queue (the queue applies the ruleset), or `mergeStateStatus`
 *      is CLEAN, HAS_HOOKS or UNSTABLE (only a non-required check is not green; the gate is condition 2, so a red
 *      non-required check is reported, not blocking);
 *   4. the PR carries no `hold` label (any case).
 *   A PR labelled `design` or `risk:R3` also needs an owner APPROVED review on the head SHA, or `owner-approved` put
 *   there by the owner: the latest `labeled` / `unlabeled` issue event for it is a `labeled` whose actor is the owner
 *   user, never a bot (ADR 0119 decision 2 as amended 2026-10-28, ADR 0293). The events are read only then; an API
 *   error refuses the merge. The AI-REVIEW verdict is no longer a condition: the stackra-reviewer App is retired and
 *   AI review is advisory (ADR 0523 decision 6).
 *   With a merge queue it enqueues only while `enqueueReady` holds (owner order OP7): bot-token.mjs keeps a 30 s
 *   connect timeout and retries (STA-302).
 * Boundary: reads the PR, its checks and reviews through gh, then merges or enqueues it; changes nothing else.
 * Runtime: node
 * Governing contract: ADR 0119 (merge policy and release authority, amended 2026-11-10); ADR 0523 (decisions 3 and 6).
 * Network: gh reads retry on transient errors (bot-token.mjs); the merge or enqueue runs again after a transient
 *   failure only when a re-read shows the PR neither merged nor queued.
 * Exit: 0 merged or queued, 1 refused (reasons on stderr), 2 usage.
 * Secrets: the bot token stays in the gh child's environment.
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import * as botNetwork from "./bot-token.mjs";

export const OWNER = "figentra-usr";
const GATED_LABELS = ["design", "risk:R3"];
/** The label that stops a merge (ADR 0523 decision 3: the merger honours a HOLD label). */
export const HOLD_LABEL = "hold";
/** The merge states in which the ruleset lets a PR without a merge queue merge. */
export const MERGEABLE_STATES = ["CLEAN", "HAS_HOOKS", "UNSTABLE"];

/**
 * OP7: the enqueue path is open only while the bot's network layer has a 30 s connect timeout and retries (STA-302),
 * declared as the `CONNECT_TIMEOUT_MS` and `RETRY_ATTEMPTS` exports of `bot-token.mjs`.
 */
export const enqueueReady = (network) =>
  network.CONNECT_TIMEOUT_MS >= 30_000 && network.RETRY_ATTEMPTS >= 2;

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
    .toSorted((a, b) => a.created_at.localeCompare(b.created_at) || a.id - b.id)
    .at(-1);
  const who = last?.actor;
  return (
    last?.event === "labeled" &&
    who?.type === "User" &&
    who.login === OWNER &&
    !/\[bot\]$/i.test(who.login)
  );
}

/** Why the ruleset does not let a PR in a given merge state merge yet. */
const STATE_HINTS = {
  BEHIND: "the branch is behind its base: merge the base in",
  BLOCKED: "a required check or rule is not satisfied",
  DIRTY: "it has merge conflicts",
  DRAFT: "it is a draft",
  UNKNOWN: "GitHub is still computing it: run pr:merge again",
};

/**
 * Reasons the PR may not merge; empty means merge. `pr` carries `mergeStateStatus`; `checkRuns` are the head SHA's
 * "Quality Gate" runs; `queue` says the base branch has a merge queue; `reviews` are the REST pull reviews and
 * `events` the REST issue events (`ownerLabelled`), empty when not read.
 */
export function blockers(pr, checkRuns, { queue = false, reviews = [], events = [] } = {}) {
  const reasons = [];
  const sha = pr.headRefOid;
  if (pr.state !== "OPEN") reasons.push(`PR is ${pr.state}`);
  if (pr.isDraft) reasons.push("PR is a draft");

  const gate = [...checkRuns].toSorted((a, b) => b.id - a.id)[0];
  if (!gate) reasons.push(`no Quality Gate run on ${sha}`);
  else if (gate.conclusion !== "success")
    reasons.push(`Quality Gate on ${sha} is ${gate.conclusion ?? gate.status}`);

  const state = pr.mergeStateStatus ?? "UNKNOWN";
  if (!queue && !MERGEABLE_STATES.includes(state))
    reasons.push(
      `the ruleset does not let it merge: mergeStateStatus is ${state}${STATE_HINTS[state] ? ` (${STATE_HINTS[state]})` : ""}`,
    );

  const labels = new Set(pr.labels.map((l) => l.name));
  if ([...labels].some((l) => l.toLowerCase() === HOLD_LABEL))
    reasons.push(`labelled ${HOLD_LABEL}: take the label off to merge`);

  const gated = GATED_LABELS.filter((l) => labels.has(l));
  const ownerApproved =
    (labels.has(OWNER_LABEL) && ownerLabelled(events)) ||
    reviews.some(
      (r) =>
        r.user?.type === "User" &&
        r.user.login === OWNER &&
        r.state === "APPROVED" &&
        r.commit_id === sha,
    );
  if (gated.length && !ownerApproved)
    reasons.push(
      `labelled ${gated.join(", ")}: needs an owner approval on ${sha} or the ${OWNER_LABEL} label added by ${OWNER}${labels.has(OWNER_LABEL) ? ` (the ${OWNER_LABEL} label on it was not added by ${OWNER}, or was removed since)` : ""}`,
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
    const fields = "number,state,isDraft,headRefOid,baseRefName,labels,mergeStateStatus";
    const pr = JSON.parse(gh(["pr", "view", n, ...R, "--json", fields], token, true));
    const runs = JSON.parse(
      gh(
        ["api", `repos/${repo}/commits/${pr.headRefOid}/check-runs?check_name=Quality%20Gate`],
        token,
        true,
      ),
    ).check_runs;
    const [owner, name] = repo.startsWith("{") ? ["{owner}", "{repo}"] : repo.split("/");
    // -F (typed) fills gh's {owner}/{repo} placeholders and makes n an Int.
    const where = ["-F", `o=${owner}`, "-F", `r=${name}`, "-F", `n=${n}`];
    const { repository } = graphql(
      "query($o:String!,$r:String!,$n:Int!,$b:String!){repository(owner:$o,name:$r){" +
        "mergeQueue(branch:$b){id} pullRequest(number:$n){id}}}",
      [...where, "-f", `b=${pr.baseRefName}`],
      token,
    );
    // The owner's review and label events decide only a design or risk:R3 PR; `list` throws (refuse) on an API error.
    const labels = new Set(pr.labels.map((l) => l.name));
    const gated = GATED_LABELS.some((l) => labels.has(l));
    const reviews = gated ? list(`repos/${repo}/pulls/${n}/reviews?per_page=100`, token) : [];
    const events =
      gated && labels.has(OWNER_LABEL)
        ? list(`repos/${repo}/issues/${n}/events?per_page=100`, token)
        : [];
    const reasons = blockers(pr, runs, { queue: Boolean(repository.mergeQueue), reviews, events });
    if (reasons.length) {
      process.stderr.write(
        `pr-merge: not merging #${n}:\n${reasons.map((r) => `  - ${r}`).join("\n")}\n`,
      );
      process.exit(1);
    }
    // The gate is condition 2; a red non-required check is reported, not blocking.
    if (pr.mergeStateStatus === "UNSTABLE")
      process.stdout.write(
        `pr-merge: a non-required check on ${pr.headRefOid} is not green (mergeStateStatus UNSTABLE); reported, not blocking\n`,
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
