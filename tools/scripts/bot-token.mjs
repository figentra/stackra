#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: mint a GitHub App installation token for `stackra-bot` (`pnpm bot:token`). Builds an RS256 app JWT with
 *   node:crypto and exchanges it at POST /app/installations/{id}/access_tokens.
 * Input: STACKRA_BOT_APP_ID, STACKRA_BOT_INSTALLATION_ID, STACKRA_BOT_PRIVATE_KEY from the environment — injected by
 *   `infisical run --env=dev --path=/agents`, never from a file.
 * Output: the token alone on stdout (for piping); errors on stderr, never containing a secret. Exit 1 on failure.
 * Secrets: handles the app key and the token; prints only the token, only to stdout.
 */
import { sign } from "node:crypto";
import { fileURLToPath } from "node:url";

const b64url = (value) => Buffer.from(value).toString("base64url");

/** App JWT: iat backdated 60s for clock drift, exp 9 minutes out (GitHub caps it at 10). */
export function appJwt(appId, privateKey, now = Math.floor(Date.now() / 1000)) {
  const head = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const body = b64url(JSON.stringify({ iat: now - 60, exp: now + 540, iss: String(appId) }));
  // Vaults often store a PEM with literal "\n"; restore real newlines.
  const key = privateKey.replace(/\\n/g, "\n");
  const signature = sign("RSA-SHA256", Buffer.from(`${head}.${body}`), key).toString("base64url");
  return `${head}.${body}.${signature}`;
}

/** Exchange the app JWT for an installation token. Throws an Error whose message carries no secret. */
export async function mintToken(env = process.env, fetchImpl = fetch) {
  const missing = [
    "STACKRA_BOT_APP_ID",
    "STACKRA_BOT_INSTALLATION_ID",
    "STACKRA_BOT_PRIVATE_KEY",
  ].filter((name) => !env[name]);
  if (missing.length) throw new Error(`missing env: ${missing.join(", ")} (run under infisical)`);

  let jwt;
  try {
    jwt = appJwt(env.STACKRA_BOT_APP_ID, env.STACKRA_BOT_PRIVATE_KEY);
  } catch {
    throw new Error("could not sign the app JWT — STACKRA_BOT_PRIVATE_KEY is not a valid PEM key");
  }
  const id = encodeURIComponent(env.STACKRA_BOT_INSTALLATION_ID);
  const res = await fetchImpl(`https://api.github.com/app/installations/${id}/access_tokens`, {
    method: "POST",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${jwt}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "stackra-bot-token",
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.token) {
    throw new Error(`GitHub returned ${res.status}: ${data.message ?? "no token in response"}`);
  }
  return data.token;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    process.stdout.write(await mintToken());
  } catch (error) {
    process.stderr.write(`bot-token: ${error.message}\n`);
    process.exit(1);
  }
}
