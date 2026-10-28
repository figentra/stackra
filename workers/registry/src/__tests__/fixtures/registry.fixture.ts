/**
 * Stackra file contract:
 * Purpose: `createTestRegistry()`, the whole registry over fakes for end-to-end tests: D1 over node:sqlite with the
 *          migrations, R2, KV and the licence check in memory, a fresh ECDSA P-256 signing key, a fake GitHub OIDC
 *          issuer (RSA key, key set served through a recorded `fetch`), a fixed clock, and helpers that build a
 *          GitHub ID token, a Sigstore bundle and an npm publish body.
 * Boundary: test fixture only; no network.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0453.
 */
import { generateKeyPairSync } from "node:crypto";

import { handleRequest } from "#src/http/handle-request";
import type { RegistryDeps } from "#src/interfaces/registry-deps.interface";
import type { RegistrySettings } from "#src/interfaces/registry-settings.interface";
import type { GithubClaims } from "#src/interfaces/github-claims.interface";
import { jwksSource } from "#src/oidc/jwks-source";
import { toBase64 } from "#src/bytes/to-base64";
import { toBase64Url } from "#src/bytes/to-base64-url";
import { tarballDigests } from "#src/publish/tarball-digests";
import { createSigner } from "#src/signing/create-signer";
import { RegistryStore } from "#src/store/registry-store";
import { LicenceStore } from "#src/licence/licence-store";
import {
  MemoryKv,
  MemoryLicenceCheck,
  MemoryR2,
} from "#src/__tests__/fixtures/memory-bindings.fixture";
import { sqliteD1 } from "#src/__tests__/fixtures/sqlite-d1.fixture";
import { makeTarball } from "#src/__tests__/fixtures/tarball.fixture";

export const HOST = "npm.stackra.figentra.com";
export const ISSUER = "https://token.actions.githubusercontent.com";
export const NOW = new Date("2026-10-27T12:00:00.000Z");

/** The settings of the tests, the wrangler.jsonc defaults. */
export const SETTINGS: RegistrySettings = {
  host: HOST,
  maxTarballBytes: 52_428_800,
  maxUnpackedBytes: 104_857_600,
  publishTokenSeconds: 900,
  tokenCacheSeconds: 60,
  licenceGraceDays: 14,
  licenceMaxTokens: 20,
  oidcIssuer: ISSUER,
  oidcKeysSeconds: 3600,
  openPackumentMaxAge: 60,
  catalogueMaxLimit: 100,
  licenceDocsUrl: "https://docs.stackra.figentra.com/licensing",
  signingKeyExpires: null,
  retiredKeys: [],
};

/** The claims of the @stackra trusted publisher (migrations/0001_registry.sql). */
export const STACKRA_CLAIMS: GithubClaims = {
  iss: ISSUER,
  aud: `npm:${HOST}`,
  exp: NOW.getTime() / 1000 + 300,
  repository: "figentra/stackra",
  repository_id: "1425140001",
  repository_owner_id: "314302700",
  workflow_ref: "figentra/stackra/.github/workflows/release.yml@refs/heads/main",
  ref: "refs/heads/main",
  environment: "release",
  run_id: "42",
  run_attempt: "1",
};

/** The claims of the @stackra-pro trusted publisher. */
export const PRO_CLAIMS: GithubClaims = {
  ...STACKRA_CLAIMS,
  repository: "figentra/stackra-pro",
  repository_id: "1435812554",
  workflow_ref: "figentra/stackra-pro/.github/workflows/release.yml@refs/heads/main",
};

/**
 * A Sigstore bundle whose subject has `digest` and whose certificate names `identity`. npm's v1 statement names the
 * subject as a purl with `{ sha512: <hex> }`.
 */
export function sigstoreBundle(digest: Readonly<Record<string, string>>, identity: string): string {
  const statement = {
    _type: "https://in-toto.io/Statement/v1",
    predicateType: "https://slsa.dev/provenance/v1",
    subject: [{ name: "pkg:npm/%40stackra/pkg@1.0.0", digest }],
  };
  const der = new TextEncoder().encode(`\x30\x82fake-der\x86${identity}\x00`);
  return JSON.stringify({
    mediaType: "application/vnd.dev.sigstore.bundle.v0.3+json",
    verificationMaterial: { certificate: { rawBytes: toBase64(der) } },
    dsseEnvelope: {
      payloadType: "application/vnd.in-toto+json",
      payload: toBase64(new TextEncoder().encode(JSON.stringify(statement))),
      signatures: [],
    },
  });
}

/** The identity a release workflow's certificate carries. */
export const identityOf = (repository: string): string =>
  `https://github.com/${repository}/.github/workflows/release.yml@refs/heads/main`;

/** An npm publish body for a package.json and extra files. */
export async function publishBody(
  pkg: Readonly<Record<string, unknown>> & { readonly name: string; readonly version: string },
  options: {
    readonly files?: Readonly<Record<string, string>>;
    readonly repository?: string;
    readonly tags?: Readonly<Record<string, string>>;
    readonly provenance?: boolean;
    /** How the `.sigstore` attachment's data is sent: JSON text as npm does (default), or base64. */
    readonly provenanceEncoding?: "json" | "base64";
    readonly integrity?: string;
  } = {},
): Promise<Record<string, unknown>> {
  const tgz = makeTarball({ "package.json": JSON.stringify(pkg), ...options.files });
  const computed = await tarballDigests(tgz);
  const bare = pkg.name.slice(pkg.name.indexOf("/") + 1);
  const repository = options.repository ?? "figentra/stackra";
  const attachments: Record<string, unknown> = {
    [`${bare}-${pkg.version}.tgz`]: {
      content_type: "application/octet-stream",
      data: toBase64(tgz),
      length: tgz.length,
    },
  };
  if (options.provenance !== false) {
    const bundle = sigstoreBundle({ sha512: computed.sha512 }, identityOf(repository));
    attachments[`${pkg.name}-${pkg.version}.sigstore`] = {
      content_type: "application/vnd.dev.sigstore.bundle.v0.3+json",
      data:
        options.provenanceEncoding === "base64"
          ? toBase64(new TextEncoder().encode(bundle))
          : bundle,
      length: bundle.length,
    };
  }
  return {
    _id: pkg.name,
    name: pkg.name,
    "dist-tags": options.tags ?? { latest: pkg.version },
    versions: {
      [pkg.version]: {
        ...pkg,
        dist: { integrity: options.integrity ?? computed.integrity, shasum: computed.shasum },
      },
    },
    _attachments: attachments,
  };
}

/** The registry over fakes. */
export async function createTestRegistry() {
  const { db, sqlite } = sqliteD1();
  const tarballs = new MemoryR2();
  const cache = new MemoryKv();
  const licences = new MemoryLicenceCheck();
  const deferred: Promise<unknown>[] = [];

  const signingKey = generateKeyPairSync("ec", { namedCurve: "P-256" });
  const pem = signingKey.privateKey.export({ type: "pkcs8", format: "pem" }).toString();
  const signer = await createSigner(pem, null, []);

  const github = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const jwk = {
    ...(github.publicKey.export({ format: "jwk" }) as JsonWebKey),
    kid: "gh-1",
    alg: "RS256",
    use: "sig",
  };
  const fetches: string[] = [];
  const fakeFetch = (async (input: string | URL | Request) => {
    fetches.push(String(input));
    return new Response(JSON.stringify({ keys: [jwk] }));
  }) as typeof fetch;
  const rsa = await crypto.subtle.importKey(
    "jwk",
    github.privateKey.export({ format: "jwk" }) as JsonWebKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const deps: RegistryDeps = {
    store: new RegistryStore(db),
    licenceStore: new LicenceStore(db),
    tarballs,
    cache,
    licences,
    signer,
    oidcKeys: jwksSource(cache, fakeFetch, ISSUER, SETTINGS.oidcKeysSeconds),
    settings: SETTINGS,
    now: () => NOW,
    defer: (task) => {
      deferred.push(task);
    },
  };

  /** A signed GitHub ID token. */
  const idToken = async (
    claims: Partial<GithubClaims> = STACKRA_CLAIMS,
    kid = "gh-1",
  ): Promise<string> => {
    const encode = (value: unknown) => toBase64Url(new TextEncoder().encode(JSON.stringify(value)));
    const unsigned = `${encode({ alg: "RS256", typ: "JWT", kid })}.${encode(claims)}`;
    const signature = await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      rsa,
      new TextEncoder().encode(unsigned),
    );
    return `${unsigned}.${toBase64Url(new Uint8Array(signature))}`;
  };

  /** One request to the registry. */
  const request = (
    path: string,
    init: { method?: string; token?: string; body?: unknown; accept?: string } = {},
  ): Promise<Response> => {
    const headers = new Headers();
    if (init.token !== undefined) headers.set("authorization", `Bearer ${init.token}`);
    if (init.accept !== undefined) headers.set("accept", init.accept);
    if (init.body !== undefined) headers.set("content-type", "application/json");
    return handleRequest(
      new Request(`https://${HOST}${path}`, {
        method: init.method ?? "GET",
        headers,
        ...(init.body === undefined ? {} : { body: JSON.stringify(init.body) }),
      }),
      deps,
    );
  };

  /** A publish token for `name` from the OIDC exchange. */
  const publishToken = async (
    name: string,
    claims: GithubClaims = STACKRA_CLAIMS,
  ): Promise<string> => {
    const response = await request(
      `/-/npm/v1/oidc/token/exchange/package/${name.replace("/", "%2f")}`,
      { method: "POST", token: await idToken(claims) },
    );
    if (response.status !== 201) throw new Error(`exchange answered ${response.status}`);
    return ((await response.json()) as { token: string }).token;
  };

  /** Exchanges a token and publishes one version; answers the publish response. */
  const publish = async (
    pkg: Parameters<typeof publishBody>[0],
    options: Parameters<typeof publishBody>[1] & { readonly claims?: GithubClaims } = {},
  ): Promise<Response> => {
    const token = await publishToken(pkg.name, options.claims);
    return request(`/${pkg.name.replace("/", "%2f")}`, {
      method: "PUT",
      token,
      body: await publishBody(pkg, options),
    });
  };

  return {
    deps,
    db,
    sqlite,
    tarballs,
    cache,
    licences,
    signer,
    signingPublicKey: signingKey.publicKey,
    fetches,
    deferred,
    idToken,
    request,
    publishToken,
    publish,
  };
}
