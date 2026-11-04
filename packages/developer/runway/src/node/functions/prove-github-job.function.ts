/**
 * Stackra file contract:
 * Purpose: `proveGithubJob({ github, environment? })`, the proof that this process runs in a GitHub Actions job of the
 *          root runway's repository (`providers.github`), and, with `environment`, behind that environment's approval: it asks the
 *          runner for an OIDC token (audience `stackra-runway`), checks its RS256 signature against GitHub's published
 *          keys, its issuer, audience, expiry and `repository` claim, and returns the claims. With `environment` the
 *          token's `environment` claim must be that runway environment's name, or a GitHub environment
 *          `providers.github.environments` declares with reviewers. It replaces the self-asserted `--approved`
 *          flag and `GITHUB_ACTIONS=true` (STA-2099 item 4, ADR 0523).
 * Boundary: a local shell has no `ACTIONS_ID_TOKEN_REQUEST_*` pair, and setting one cannot forge GitHub's signature.
 *           The token is never logged, returned or put in an error; only claim names and values the caller compares.
 *           The runner hands a token only to a job with `permissions: id-token: write`.
 * Runtime: node
 * Governing contract: ADR 0468 (the owner's approval); ADR 0523 (no self-asserted trust); ADR 0173; STA-2099;
 *                     STA-2100.
 */
import { createPublicKey, verify, type webcrypto } from "node:crypto";

import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import type { RootRunway } from "#core/types/root-runway.type";
import { RUNWAY_OIDC } from "#node/constants/runway-oidc.constant";
import type { GithubJobClaims } from "#node/types/github-job-claims.type";

/** A fetch that answers JSON: `fetch`, or a test's fake. */
type JsonFetch = (url: string, headers: Record<string, string>) => Promise<unknown>;

const fetchJson: JsonFetch = async (url, headers) => {
  const response = await globalThis.fetch(url, { headers, signal: AbortSignal.timeout(30_000) });
  if (!response.ok)
    throw new RunwayUnresolvedError(`${new URL(url).host} answered ${response.status}`);
  return response.json();
};

const part = (text: string): Record<string, unknown> => {
  const value: unknown = JSON.parse(Buffer.from(text, "base64url").toString("utf8"));
  if (typeof value !== "object" || value === null) throw new SyntaxError("not an object");
  return value as Record<string, unknown>;
};

/**
 * Proves the job, and with `environment` its approval, from GitHub's signed OIDC token.
 *
 * @param input.github - the root runway's `providers.github`: the repository and its reviewed environments.
 * @param input.environment - the runway environment whose approval the job must sit behind; omit for "in CI only".
 * @param input.env - where the runner's token request pair is read; `process.env` by default.
 * @param input.fetch - the JSON fetch; a test's fake.
 * @param input.now - seconds since the epoch; a test's clock.
 * @throws RunwayUnresolvedError when there is no token, it does not verify, or a claim does not match.
 * @example
 * await proveGithubJob({ github: root.providers?.github, environment: "production" }); // throws on a workstation
 */
export async function proveGithubJob(input: {
  readonly github: NonNullable<RootRunway["providers"]>["github"] | undefined;
  readonly environment?: string | undefined;
  readonly env?: Readonly<Record<string, string | undefined>> | undefined;
  readonly fetch?: JsonFetch | undefined;
  readonly now?: number | undefined;
}): Promise<GithubJobClaims> {
  const env = input.env ?? process.env;
  const get = input.fetch ?? fetchJson;
  const { github } = input;
  const refuse = (why: string) =>
    new RunwayUnresolvedError(
      `${why}: this runs only in a GitHub Actions job of ${github === undefined ? "the repository" : `${github.org}/${github.repo}`}${input.environment === undefined ? "" : ` behind ${input.environment}'s approval`}, with \`permissions: id-token: write\` (ADR 0468, ADR 0523)`,
    );
  if (github === undefined) throw refuse("runway.yaml names no providers.github repository");
  const url = env["ACTIONS_ID_TOKEN_REQUEST_URL"];
  const bearer = env["ACTIONS_ID_TOKEN_REQUEST_TOKEN"];
  if (url === undefined || url === "" || bearer === undefined || bearer === "")
    throw refuse("no GitHub OIDC token can be requested here");

  const minted = (await get(
    `${url}${url.includes("?") ? "&" : "?"}audience=${RUNWAY_OIDC.audience}`,
    {
      authorization: `bearer ${bearer}`,
    },
  )) as { value?: unknown };
  const token = typeof minted.value === "string" ? minted.value : "";
  const [head = "", body = "", signature = ""] = token.split(".");
  let header: Record<string, unknown>;
  let claims: Record<string, unknown>;
  try {
    header = part(head);
    claims = part(body);
  } catch {
    throw refuse("the runner's OIDC token is not a JWT");
  }
  const { keys } = (await get(RUNWAY_OIDC.keys, {})) as {
    keys?: readonly (webcrypto.JsonWebKey & { kid?: string })[];
  };
  const key = keys?.find((candidate) => candidate.kid === header["kid"]);
  const signed =
    header["alg"] === "RS256" &&
    key !== undefined &&
    verify(
      "RSA-SHA256",
      Buffer.from(`${head}.${body}`),
      createPublicKey({ key, format: "jwk" }),
      Buffer.from(signature, "base64url"),
    );
  if (!signed) throw refuse("the OIDC token's signature is not GitHub's");

  const now = input.now ?? Math.floor(Date.now() / 1000);
  const audience = claims["aud"];
  if (claims["iss"] !== RUNWAY_OIDC.issuer) throw refuse("the OIDC token has another issuer");
  if (
    audience !== RUNWAY_OIDC.audience &&
    !(Array.isArray(audience) && audience.includes(RUNWAY_OIDC.audience))
  )
    throw refuse(`the OIDC token is not for ${RUNWAY_OIDC.audience}`);
  if (typeof claims["exp"] !== "number" || claims["exp"] <= now)
    throw refuse("the OIDC token has expired");
  const repository = `${github.org}/${github.repo}`;
  if (
    typeof claims["repository"] !== "string" ||
    claims["repository"].toLowerCase() !== repository.toLowerCase()
  )
    throw refuse(`the OIDC token is for ${String(claims["repository"])}`);

  const environment = typeof claims["environment"] === "string" ? claims["environment"] : undefined;
  if (input.environment !== undefined) {
    const reviewed = (name: string) => (github.environments?.[name]?.reviewers?.length ?? 0) > 0;
    if (environment === undefined) throw refuse("the job runs in no GitHub environment");
    if (environment !== input.environment && !reviewed(environment))
      throw refuse(
        `the job's GitHub environment ${environment} is neither ${input.environment} nor a reviewed one`,
      );
  }
  return {
    repository,
    environment,
    ref: typeof claims["ref"] === "string" ? claims["ref"] : undefined,
    sha: typeof claims["sha"] === "string" ? claims["sha"] : undefined,
  };
}
