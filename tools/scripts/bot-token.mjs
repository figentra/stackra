#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: mint a GitHub App installation token for `stackra-bot` (`pnpm bot:token`). Builds an RS256 app JWT with
 *   node:crypto and exchanges it at POST /app/installations/{id}/access_tokens.
 * Boundary: mints a token and wraps fetch and gh reads with the connect timeout and retries; holds no state between
 *           runs.
 * Runtime: node
 * Governing contract: ADR 0230 (reviewer identity separate from builder); STA-302 (network layer).
 * Input: STACKRA_BOT_APP_ID, STACKRA_BOT_PRIVATE_KEY and (a fallback, read only when the target repository is not
 *   known) STACKRA_BOT_INSTALLATION_ID from the environment — injected by `secrets-exec.mjs` from the `agents` scope of
 *   figentra/secrets (ADR 0525), never from a file. Given the repository a command acts on (target-repo.mjs), the
 *   installation is looked up for it with the app JWT (GET /repos/{owner}/{repo}/installation), so the one App
 *   installed in several organizations mints for the right one and a stale stored id no longer blocks merges
 *   (STA-2861). `pnpm bot:token [-R owner/repo]` mints for that repository, else the working directory's origin.
 *   (The reviewer app's STACKRA_REVIEWER_ names are retired with that App, ADR 0523 decision 6.)
 * Output: the token alone on stdout (for piping); errors on stderr, never containing a secret. Exit 1 on failure.
 * Network: the one layer bot-gh, pr-merge and linear call GitHub and Linear through (STA-302). fetch goes over an
 *   undici Agent with a CONNECT_TIMEOUT_MS connect timeout and autoSelectFamily; an idempotent call (GET, the token
 *   mint, a gh read) is tried RETRY_ATTEMPTS times with exponential backoff and full jitter on a network failure or a
 *   502/503/504; a call that is not idempotent (merge, enqueue, comment) runs again only after a fresh read shows the
 *   failed attempt did not land.
 * Secrets: handles the app key and the token; prints only the token, only to stdout.
 */
import { spawnSync } from "node:child_process";
import { sign } from "node:crypto";
import { fileURLToPath } from "node:url";
import { targetRepo } from "./target-repo.mjs";

// linear-sync runs node without `pnpm install`: there the global fetch (10 s connect timeout) keeps only the retries.
const undici = await import("undici").catch((error) => {
  if (error.code === "ERR_MODULE_NOT_FOUND") return null;
  throw error;
});

/**
 * Connect timeout of every GitHub and Linear fetch; undici's 10 s default failed 1 slow connect in 5 (STA-302). It
 * reads 10 s where undici is not installed, so the OP7 gate (`enqueueReady`) stays shut there.
 */
export const CONNECT_TIMEOUT_MS = undici ? 30_000 : 10_000;
/** Tries of an idempotent call, the first included. */
export const RETRY_ATTEMPTS = 4;
/** Ceiling of the first backoff; retry n waits a random 0 to BACKOFF_MS * 2^(n-1) ms. */
const BACKOFF_MS = 500;
const RETRY_STATUS = new Set([502, 503, 504]);
/** Error text that a retry may fix: a fetch rejection, connect timeouts and resets, HTTP 502/503/504 (gh, Linear). */
const TRANSIENT =
  /fetch failed|UND_ERR_(?:CONNECT_TIMEOUT|SOCKET)|ECONNRESET|ETIMEDOUT|EAI_AGAIN|connection reset|i\/o timeout|TLS handshake timeout|timed out|Timeout exceeded|unexpected EOF|HTTP 50[234]\b|Bad Gateway|Service Unavailable|Gateway Time-?out/i;

const dispatcher =
  undici && new undici.Agent({ connectTimeout: CONNECT_TIMEOUT_MS, autoSelectFamily: true });

const sleep = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
const sleepSync = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

/** The wait before retry `n` (1, 2, …): exponential backoff with full jitter. */
export const backoff = (n, random = Math.random) =>
  Math.floor(random() * BACKOFF_MS * 2 ** (n - 1));

/** Calls `attempt` until `again(result)` (may be async) is false or RETRY_ATTEMPTS ran, backing off in between. */
async function retry(attempt, again, wait = sleep) {
  let result = await attempt();
  for (let n = 1; n < RETRY_ATTEMPTS && (await again(result)); n++) {
    await wait(backoff(n));
    result = await attempt();
  }
  return result;
}

/**
 * fetch over the Agent. An idempotent call (GET and HEAD by default; pass `idempotent: true` for a POST that is, like a
 * token mint) is retried on a network failure or a 502/503/504; any other call is sent once.
 */
export async function netFetch(url, init = {}, options = {}) {
  const { idempotent = /^(GET|HEAD)$/i.test(init.method ?? "GET"), wait } = options;
  const once = () =>
    (undici ? undici.fetch(url, { ...init, dispatcher }) : fetch(url, init)).then(
      (res) => ({ res }),
      (error) => ({ error }),
    );
  const again = (r) => idempotent && (r.error !== undefined || RETRY_STATUS.has(r.res.status));
  const { res, error } = await retry(once, again, wait);
  if (error) throw error;
  return res;
}

/**
 * A call that is not idempotent (merge, enqueue, comment): after each TRANSIENT failure, the last one included,
 * `landed()` (a fresh read) says whether it landed anyway; only when it did not is the call run again. Resolves to
 * run()'s value, or undefined if it landed. A failing read keeps the call's own error and says the outcome is unknown.
 */
export async function retryUnlessLanded(run, landed, wait = sleep) {
  for (let n = 1; ; n++) {
    let error;
    try {
      return await run();
    } catch (failureError) {
      error = failureError;
    }
    if (!TRANSIENT.test(error.message)) throw error;
    let done;
    try {
      done = await landed();
    } catch (readError) {
      throw new Error(
        `${error.message}; outcome unknown, check it by hand (re-read failed: ${readError.message})`,
        { cause: readError },
      );
    }
    if (done) return undefined;
    if (n >= RETRY_ATTEMPTS) throw error;
    await wait(backoff(n));
  }
}

/**
 * True for a GraphQL document that only reads: after leading whitespace and `#` comments it opens with `query` or `{`.
 * Anything else (a mutation, a subscription, a leading fragment) counts as a write and is never retried.
 * Only the first operation is read: a document holding several operations is not supported here.
 */
export const isGraphqlRead = (document) => /^(?:\s|#[^\n]*\n)*(?:query\b|\{)/.test(document);

/** gh commands safe to repeat: view, list, diff, checks and status subcommands, `gh search`, and `gh api` as GET. */
export function ghIdempotent(args) {
  const [group, verb] = args.filter(
    (a, i) => !a.startsWith("-") && !/^(-R|--repo)$/.test(args[i - 1]),
  );
  if (group === "api")
    return !args.some(
      (a) => /^--(method|field|raw-field|input)\b/.test(a) || /^-[^-]*[XfF]/.test(a),
    );
  return group === "search" || ["view", "list", "diff", "checks", "status"].includes(verb);
}

/** Whether a spawnSync result failed with a TRANSIENT error or stderr. */
const failedTransiently = (r) =>
  r.status !== 0 && TRANSIENT.test(`${r.error?.message ?? ""} ${r.stderr ?? ""}`);

/** spawnSync of an idempotent command, run again with backoff while it fails with TRANSIENT stderr (pipe it). */
export function spawnRetrying(cmd, args, options, wait = sleepSync) {
  let r = spawnSync(cmd, args, options);
  for (let n = 1; n < RETRY_ATTEMPTS && failedTransiently(r); n++) {
    const why = `${r.stderr || r.error?.message}`.trim().split("\n")[0];
    process.stderr.write(`retrying ${cmd} ${args[0]} (${n + 1}/${RETRY_ATTEMPTS}) after: ${why}\n`);
    wait(backoff(n));
    r = spawnSync(cmd, args, options);
  }
  return r;
}

const b64url = (value) => Buffer.from(value).toString("base64url");

/** App JWT: iat backdated 60s for clock drift, exp 9 minutes out (GitHub caps it at 10). */
export function appJwt(appId, privateKey, now = Math.floor(Date.now() / 1000)) {
  const head = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const body = b64url(JSON.stringify({ iat: now - 60, exp: now + 540, iss: String(appId) }));
  // Vaults often store a PEM with literal "\n"; restore real newlines.
  const key = privateKey.replaceAll("\\n", "\n");
  const signature = sign("RSA-SHA256", Buffer.from(`${head}.${body}`), key).toString("base64url");
  return `${head}.${body}.${signature}`;
}

const HEADERS = {
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
  "User-Agent": "stackra-bot-token",
};

/**
 * The id of the App's installation on `repo` (`owner/name`), read with the app JWT (retried: a GET). A 404 means the
 * App is not installed there: the Error says so, and no stored id is tried, since it could only mint a token that
 * cannot reach the repository. The Error carries no secret.
 */
export async function installationFor(repo, jwt, fetchImpl = netFetch) {
  const res = await fetchImpl(
    `https://api.github.com/repos/${repo}/installation`,
    { method: "GET", headers: { ...HEADERS, Authorization: `Bearer ${jwt}` } },
    { idempotent: true },
  );
  const data = await res.json().catch(() => ({}));
  if (res.status === 404)
    throw new Error(`the App is not installed on ${repo} (GitHub returned 404)`);
  if (!res.ok || !data.id)
    throw new Error(
      `GitHub returned ${res.status} looking up the installation for ${repo}: ${data.message ?? "no id"}`,
    );
  return String(data.id);
}

/**
 * Exchange the app JWT for an installation token (retried: a mint is idempotent). The Error carries no secret.
 * With `repo` (`owner/name`) the installation is the one covering that repository (installationFor); without it,
 * the stored `<prefix>_INSTALLATION_ID`, the fallback for a command whose repository cannot be told.
 */
export async function mintToken(
  env = process.env,
  fetchImpl = netFetch,
  prefix = "STACKRA_BOT",
  repo = null,
) {
  const [appId, installation, privateKey] = ["APP_ID", "INSTALLATION_ID", "PRIVATE_KEY"].map(
    (n) => `${prefix}_${n}`,
  );
  const needed = repo ? [appId, privateKey] : [appId, installation, privateKey];
  const missing = needed.filter((name) => !env[name]);
  if (missing.length)
    throw new Error(
      `missing env: ${missing.join(", ")} (run through pnpm bot:*, which decrypts them)`,
    );

  let jwt;
  try {
    jwt = appJwt(env[appId], env[privateKey]);
  } catch {
    throw new Error(`could not sign the app JWT — ${privateKey} is not a valid PEM key`);
  }
  const id = encodeURIComponent(
    repo ? await installationFor(repo, jwt, fetchImpl) : env[installation],
  );
  const res = await fetchImpl(
    `https://api.github.com/app/installations/${id}/access_tokens`,
    { method: "POST", headers: { ...HEADERS, Authorization: `Bearer ${jwt}` } },
    { idempotent: true },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.token) {
    throw new Error(`GitHub returned ${res.status}: ${data.message ?? "no token in response"}`);
  }
  return data.token;
}

/**
 * The stackra-bot token for one command (`tool` gh or git and its arguments): minted for the installation covering
 * the repository the command acts on (target-repo.mjs), or for the stored id when that cannot be told. bot-gh,
 * pr-merge, adr-reserve and `pnpm bot:token` all mint through this (STA-2861).
 */
export function mintForCommand(
  tool,
  args,
  { env = process.env, fetchImpl = netFetch, run = undefined } = {},
) {
  return mintToken(env, fetchImpl, "STACKRA_BOT", targetRepo(tool, args, { env, run }));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    // `-R owner/repo` names the repository; else GH_REPO, else the working directory's origin (STA-2861).
    process.stdout.write(await mintForCommand("gh", process.argv.slice(2)));
  } catch (error) {
    process.stderr.write(`bot-token: ${error.message}\n`);
    process.exit(1);
  }
}
