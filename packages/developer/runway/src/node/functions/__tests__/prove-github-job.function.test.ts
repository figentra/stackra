/**
 * Stackra file contract:
 * Purpose: unit tests of `proveGithubJob`: a token GitHub's key signed, for this repository and audience, proves the
 *          job; with an environment it must be that environment or a reviewed one. A missing request pair, another
 *          key's signature, another audience, an expired token, another repository and an unreviewed environment are
 *          refused, and no refusal carries the token.
 * Boundary: test only; the keys are generated here and the runner and JWKS answers are a fake fetch.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0468; ADR 0523; STA-2100.
 */
import { generateKeyPairSync, sign, type KeyObject } from "node:crypto";

import { describe, expect, it } from "@stackra/testing";

import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import { proveGithubJob } from "#node/functions/prove-github-job.function";

const github = generateKeyPairSync("rsa", { modulusLength: 2048 });
const other = generateKeyPairSync("rsa", { modulusLength: 2048 });
const NOW = 1_800_000_000;

const GITHUB = {
  org: "acme",
  repo: "platform",
  environments: { static: { reviewers: ["owner"] }, docs: {} },
};

const part = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");

const jwt = (claims: Record<string, unknown>, key: KeyObject = github.privateKey) => {
  const body = `${part({ alg: "RS256", kid: "k1" })}.${part(claims)}`;
  return `${body}.${sign("RSA-SHA256", Buffer.from(body), key).toString("base64url")}`;
};

const CLAIMS = {
  iss: "https://token.actions.githubusercontent.com",
  aud: "stackra-runway",
  exp: NOW + 300,
  repository: "acme/platform",
  environment: "production",
  ref: "refs/heads/main",
  sha: "a".repeat(40),
};

const ENV = {
  ACTIONS_ID_TOKEN_REQUEST_URL: "https://runner.test/token?x=1",
  ACTIONS_ID_TOKEN_REQUEST_TOKEN: "t",
};

/** A runner that mints `token` and a JWKS holding GitHub's public key; records the URLs it was asked. */
const runner = (token: string) => {
  const asked: string[] = [];
  const fetch = async (url: string) => {
    asked.push(url);
    if (url.startsWith("https://runner.test/")) return { value: token };
    return { keys: [{ ...github.publicKey.export({ format: "jwk" }), kid: "k1" }] };
  };
  return { asked, fetch };
};

const prove = (token: string, environment?: string, env: Record<string, string> = ENV) =>
  proveGithubJob({ github: GITHUB, environment, env, fetch: runner(token).fetch, now: NOW });

describe("proveGithubJob", () => {
  it("proves a GitHub-signed token for this repository, asking for runway's audience", async () => {
    const { asked, fetch } = runner(jwt(CLAIMS));
    const claims = await proveGithubJob({ github: GITHUB, env: ENV, fetch, now: NOW });
    expect(claims).toEqual({
      repository: "acme/platform",
      environment: "production",
      ref: "refs/heads/main",
      sha: "a".repeat(40),
    });
    expect(asked[0]).toBe("https://runner.test/token?x=1&audience=stackra-runway");
  });

  it("proves an approval in the runway environment itself or a reviewed GitHub environment", async () => {
    await expect(prove(jwt(CLAIMS), "production")).resolves.toMatchObject({
      environment: "production",
    });
    await expect(
      prove(jwt({ ...CLAIMS, environment: "static" }), "production"),
    ).resolves.toMatchObject({
      environment: "static",
    });
  });

  it("refuses an unreviewed environment or none for an approval", async () => {
    await expect(prove(jwt({ ...CLAIMS, environment: "docs" }), "production")).rejects.toThrow(
      /docs is neither production nor a reviewed one/,
    );
    const { environment: _dropped, ...none } = CLAIMS;
    await expect(prove(jwt(none), "production")).rejects.toThrow(/no GitHub environment/);
  });

  it("refuses without the runner's token request pair, as on a workstation", async () => {
    await expect(prove(jwt(CLAIMS), undefined, {})).rejects.toThrow(RunwayUnresolvedError);
    await expect(prove(jwt(CLAIMS), undefined, { GITHUB_ACTIONS: "true" })).rejects.toThrow(
      /no GitHub OIDC token can be requested here/,
    );
  });

  it("refuses another key's signature, another audience, an expired token and another repository", async () => {
    const forged = jwt(CLAIMS, other.privateKey);
    await expect(prove(forged)).rejects.toThrow(/signature is not GitHub's/);
    await expect(prove(jwt({ ...CLAIMS, aud: "sts.amazonaws.com" }))).rejects.toThrow(
      /not for stackra-runway/,
    );
    await expect(prove(jwt({ ...CLAIMS, exp: NOW }))).rejects.toThrow(/expired/);
    await expect(prove(jwt({ ...CLAIMS, repository: "evil/platform" }))).rejects.toThrow(
      /evil\/platform/,
    );
    await expect(prove("not-a-jwt")).rejects.toThrow(/not a JWT/);
  });

  it("never puts the token in a refusal", async () => {
    const token = jwt({ ...CLAIMS, aud: "elsewhere" });
    const refusal = (await prove(token).catch((error: unknown) => error)) as Error;
    expect(refusal.message.includes(token)).toBe(false);
  });
});
