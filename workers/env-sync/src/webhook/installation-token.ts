/**
 * Stackra file contract:
 * Purpose: `installationToken(repository, env, fetcher, nowSeconds)`, a GitHub token for one dispatch: an App JWT
 *          (RS256, signed with WebCrypto from the stackra-bot App's private key) finds the App's installation on the
 *          routed repository, which then mints an installation token limited to that one repository with
 *          `actions: write`. An installation token lives an hour, so none is stored.
 * Boundary: an unset or unreadable App id or key answers 503 `sync_misconfigured`; a GitHub refusal answers 502.
 *           Never logs or returns the key, the JWT or a GitHub body.
 * Runtime: worker
 * Governing contract: ADR 0173 (amendment of 2026-11-04, decision 6); STA-2133 (SECRETS Q17: the stackra-bot App,
 *                     names STACKRA_BOT_APP_ID and STACKRA_BOT_PRIVATE_KEY); GitHub's App authentication REST API.
 */
import { GITHUB_HEADERS } from "#src/constants";
import type { AppToken, EnvSyncEnv } from "#src/interfaces";

import { pkcs8Of } from "./pkcs8-of";

/** GitHub's REST API. */
const API = "https://api.github.com";

/** base64url of bytes or a string. */
const base64url = (data: Uint8Array | string): string =>
  btoa(typeof data === "string" ? data : String.fromCodePoint(...data))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");

/** The App JWT: issued 60 s back for clock drift, expiring after 9 minutes (GitHub allows 10). */
async function appJwt(appId: string, key: CryptoKey, nowSeconds: number): Promise<string> {
  const head = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64url(
    JSON.stringify({ iat: nowSeconds - 60, exp: nowSeconds + 540, iss: appId }),
  );
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(`${head}.${claims}`),
  );
  return `${head}.${claims}.${base64url(new Uint8Array(signature))}`;
}

/**
 * A token that may dispatch workflows in `repository` alone.
 *
 * @param repository - `owner/repo`, already checked against REPOSITORY_PATTERN.
 * @param nowSeconds - the current Unix time in seconds (a fixed value in tests).
 * @example
 * const got = await installationToken("figentra/pay", env, fetch, Math.floor(Date.now() / 1000));
 * if ("token" in got) dispatch(got.token);
 */
export async function installationToken(
  repository: string,
  env: EnvSyncEnv,
  fetcher: typeof fetch,
  nowSeconds: number,
): Promise<AppToken> {
  const misconfigured = {
    status: 503,
    code: "sync_misconfigured",
    message: "STACKRA_BOT_APP_ID or STACKRA_BOT_PRIVATE_KEY is not configured",
  } as const;
  const appId = env.STACKRA_BOT_APP_ID?.trim();
  const der8 = pkcs8Of(env.STACKRA_BOT_PRIVATE_KEY ?? "");
  if (appId === undefined || appId === "" || der8 === undefined) return misconfigured;
  let key: CryptoKey;
  try {
    key = await crypto.subtle.importKey(
      "pkcs8",
      der8,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"],
    );
  } catch {
    return misconfigured;
  }
  const jwt = await appJwt(appId, key, nowSeconds);
  const asApp = { ...GITHUB_HEADERS, authorization: `Bearer ${jwt}` };

  const installation = await fetcher(`${API}/repos/${repository}/installation`, {
    headers: asApp,
  });
  const id = installation.ok ? ((await installation.json()) as { id?: unknown }).id : undefined;
  if (typeof id !== "number")
    return {
      status: 502,
      code: "app_not_installed",
      message: `GitHub answered ${installation.status} for the App's installation`,
    };

  const minted = await fetcher(`${API}/app/installations/${id}/access_tokens`, {
    method: "POST",
    headers: { ...asApp, "content-type": "application/json" },
    body: JSON.stringify({
      repositories: [repository.split("/")[1]],
      permissions: { actions: "write" },
    }),
  });
  const token =
    minted.status === 201 ? ((await minted.json()) as { token?: unknown }).token : undefined;
  return typeof token === "string" && token !== ""
    ? { token }
    : {
        status: 502,
        code: "token_refused",
        message: `GitHub answered ${minted.status} for the token`,
      };
}
