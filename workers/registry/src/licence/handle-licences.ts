/**
 * Stackra file contract:
 * Purpose: `handleLicences`, the licence API `/-/stackra/v1/licences` (ADR 0453 decision 14), the OS billing hook:
 *          `POST /` issues a licence (with its first token when `tokenLabel` is set), `PATCH /:id` renews
 *          (`expiresAt`) or sets the grants, `POST /:id/suspend`, `/:id/resume` and `/:id/revoke`, `POST /:id/tokens`
 *          adds a token (at most `REGISTRY_LICENCE_MAX_TOKENS` live ones), `DELETE /:id/tokens/:tokenId` revokes one.
 *          Each call answers the `RegistryLicence` of `@stackra/licensing/contracts`.
 * Boundary: the caller is an issuer token (`issuer_tokens`, hash only), else 401. Every call needs `Idempotency-Key`:
 *           a replay of the same request answers the stored body (its `issuedToken` null: a token is shown once), the
 *           same key with another request is 409. The writes, the receipt and the audit row go in one D1 batch. A
 *           grant names a `licensed` scope only (422); a revoked licence is final (409). The API never makes a licence
 *           `internal`. Revocation reaches reads within `REGISTRY_TOKEN_CACHE_SECONDS` (the edge cache). Never logs a
 *           body or a token.
 * Runtime: worker
 * Governing contract: ADR 0453 (decisions 13, 14 and 19); ADR 0461 (decision 3); stackra-183 (STA-1335).
 */
import type { RegistryLicence, RegistryLicenceGrant } from "@stackra/licensing/contracts";

import { bearer } from "#src/access/bearer";
import { sha256Hex } from "#src/bytes/sha256-hex";
import { failure } from "#src/http/failure";
import { json } from "#src/http/json";
import type { D1Statement } from "#src/interfaces/d1-statement.interface";
import type { RegistryDeps } from "#src/interfaces/registry-deps.interface";
import { newLicenceToken } from "#src/licence/new-licence-token";

/** One licence API call, from the method and the path after `/-/stackra/v1/licences`. */
type Call =
  | { readonly action: "issue" }
  | { readonly action: "patch" | "suspend" | "resume" | "revoke" | "addToken"; readonly id: string }
  | { readonly action: "revokeToken"; readonly id: string; readonly tokenId: string };

/** What one call writes and answers. */
interface Outcome {
  readonly licence: RegistryLicence;
  readonly statements: D1Statement[];
  readonly status: 200 | 201;
  readonly issuedToken: string | null;
}

/** A refused call: its status and reason. */
class Refusal extends Error {
  readonly status: number;

  constructor(status: number, reason: string) {
    super(reason);
    this.status = status;
  }
}

/** A printable header value: the shape of an OS event id (a format guard, not a business limit). */
const IDEMPOTENCY_KEY = /^[\x21-\x7e]{1,255}$/;

/** A full scoped name, as `parsePath` accepts it. */
const NAME = /^@[a-z0-9][a-z0-9-._~]*\/[a-z0-9][a-z0-9-._~]*$/;

const STATUS_ACTIONS = new Set(["suspend", "resume", "revoke"]);

/** The call of a method and path, or null for an unknown route (404) or method (405 with `allow`). */
function callOf(method: string, rest: readonly string[]): Call | { readonly allow: string } | null {
  const [id, sub, tokenId, ...extra] = rest;
  if (extra.length > 0 || rest.some((part) => part === "")) return null;
  if (id === undefined) return method === "POST" ? { action: "issue" } : { allow: "POST" };
  if (sub === undefined) return method === "PATCH" ? { action: "patch", id } : { allow: "PATCH" };
  if (tokenId === undefined && STATUS_ACTIONS.has(sub))
    return method === "POST"
      ? { action: sub as "suspend" | "resume" | "revoke", id }
      : { allow: "POST" };
  if (sub !== "tokens") return null;
  if (tokenId === undefined)
    return method === "POST" ? { action: "addToken", id } : { allow: "POST" };
  return method === "DELETE" ? { action: "revokeToken", id, tokenId } : { allow: "DELETE" };
}

/** An object body field set, or a 400. */
function objectOf(text: string): Readonly<Record<string, unknown>> {
  if (text === "") return {};
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Refusal(400, "body is not JSON");
  }
  if (typeof value !== "object" || value === null || Array.isArray(value))
    throw new Refusal(400, "body must be a JSON object");
  return value as Readonly<Record<string, unknown>>;
}

/** A non-empty string field, or a 400. */
function textOf(body: Readonly<Record<string, unknown>>, field: string): string {
  const value = body[field];
  if (typeof value !== "string" || value.trim() === "")
    throw new Refusal(400, `${field} must be a non-empty string`);
  return value.trim();
}

/** A null or ISO 8601 date field (normalised), or a 400. */
function dateOf(body: Readonly<Record<string, unknown>>, field: string): string | null {
  const value = body[field] ?? null;
  if (value === null) return null;
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value)))
    throw new Refusal(400, `${field} must be an ISO 8601 date or null`);
  return new Date(value).toISOString();
}

/** The grants field: each names a `licensed` scope and `*` or full names of that scope, else a 400 or 422. */
async function readGrants(
  deps: RegistryDeps,
  body: Readonly<Record<string, unknown>>,
): Promise<RegistryLicenceGrant[]> {
  const value = body.grants;
  if (!Array.isArray(value)) throw new Refusal(400, "grants must be an array");
  const grants = value.map((grant: unknown): RegistryLicenceGrant => {
    const { scope, names } = (grant ?? {}) as { scope?: unknown; names?: unknown };
    if (typeof scope !== "string" || !/^@[a-z0-9][a-z0-9-._~]*$/.test(scope))
      throw new Refusal(400, "a grant needs a scope such as @stackra-pro");
    if (names === "*") return { scope, names };
    if (
      !Array.isArray(names) ||
      names.length === 0 ||
      !names.every(
        (name) => typeof name === "string" && NAME.test(name) && name.startsWith(`${scope}/`),
      )
    )
      throw new Refusal(400, `the names of ${scope} must be "*" or full names of that scope`);
    // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
    return { scope, names: [...new Set(names as string[])].sort() };
  });
  const rules = await deps.licenceStore.readRules(grants.map((grant) => grant.scope));
  for (const grant of grants)
    if (rules.get(grant.scope) !== "licensed")
      throw new Refusal(422, `${grant.scope} is not a licensed scope`);
  return grants;
}

/** The licence of a call that names one, or a 404 (409 for a revoked licence on anything but revoke). */
async function current(
  deps: RegistryDeps,
  id: string,
  action: Call["action"],
): Promise<RegistryLicence> {
  const licence = await deps.licenceStore.licence(id);
  if (licence === null) throw new Refusal(404, "licence not found");
  if (licence.status === "revoked" && action !== "revoke")
    throw new Refusal(409, "licence is revoked");
  return licence;
}

/** Adds one token to `licence`, unless it already has the most live tokens. */
async function withToken(
  deps: RegistryDeps,
  licence: RegistryLicence,
  label: string,
  now: string,
): Promise<{
  readonly licence: RegistryLicence;
  readonly statement: D1Statement;
  readonly token: string;
}> {
  // shortcut: counted before the batch, so two racing calls may each add the last token; D1 serialises writes per
  // database and the issuer is our own billing service, so the bound is at most one token over. Upgrade with a
  // conditional INSERT once D1Statement exposes `meta.changes`.
  const live = licence.tokens.filter((token) => token.revokedAt === null).length;
  if (live >= deps.settings.licenceMaxTokens)
    throw new Refusal(
      422,
      `licence has ${deps.settings.licenceMaxTokens} live tokens, the most allowed`,
    );
  const { token, hash } = await newLicenceToken();
  const id = `tok_${crypto.randomUUID()}`;
  return {
    licence: {
      ...licence,
      tokens: [...licence.tokens, { id, label, createdAt: now, revokedAt: null }],
    },
    statement: deps.licenceStore.addToken(licence.id, id, hash, label, now),
    token,
  };
}

/** What a call writes and answers. */
async function outcomeOf(
  deps: RegistryDeps,
  call: Call,
  body: Readonly<Record<string, unknown>>,
  now: string,
): Promise<Outcome> {
  const store = deps.licenceStore;
  if (call.action === "issue") {
    const notBefore = dateOf(body, "notBefore");
    const expiresAt = dateOf(body, "expiresAt");
    if (notBefore !== null && expiresAt !== null && expiresAt <= notBefore)
      throw new Refusal(400, "expiresAt must be after notBefore");
    const label = body.tokenLabel ?? null;
    const base: RegistryLicence = {
      id: `lic_${crypto.randomUUID()}`,
      holderRef: textOf(body, "holderRef"),
      grants: await readGrants(deps, body),
      notBefore,
      expiresAt,
      status: "active",
      tokens: [],
      issuedToken: null,
    };
    const statements = [store.saveLicence(base, now), ...store.replaceGrants(base.id, base.grants)];
    if (label === null) return { licence: base, statements, status: 201, issuedToken: null };
    const added = await withToken(deps, base, textOf(body, "tokenLabel"), now);
    return {
      licence: added.licence,
      statements: [...statements, added.statement],
      status: 201,
      issuedToken: added.token,
    };
  }

  const licence = await current(deps, call.id, call.action);
  switch (call.action) {
    case "patch": {
      if (!("expiresAt" in body) && !("grants" in body))
        throw new Refusal(400, "PATCH needs expiresAt or grants");
      const expiresAt = "expiresAt" in body ? dateOf(body, "expiresAt") : licence.expiresAt;
      if (licence.notBefore !== null && expiresAt !== null && expiresAt <= licence.notBefore)
        throw new Refusal(400, "expiresAt must be after notBefore");
      const grants = "grants" in body ? await readGrants(deps, body) : null;
      const next: RegistryLicence = { ...licence, expiresAt, grants: grants ?? licence.grants };
      return {
        licence: next,
        statements: [
          store.saveLicence(next, now),
          ...(grants === null ? [] : store.replaceGrants(next.id, grants)),
        ],
        status: 200,
        issuedToken: null,
      };
    }
    case "suspend":
    case "resume":
    case "revoke": {
      const status =
        call.action === "suspend" ? "suspended" : call.action === "resume" ? "active" : "revoked";
      const next: RegistryLicence = { ...licence, status };
      return {
        licence: next,
        statements: [store.saveLicence(next, now)],
        status: 200,
        issuedToken: null,
      };
    }
    case "addToken": {
      const added = await withToken(deps, licence, textOf(body, "label"), now);
      return {
        licence: added.licence,
        statements: [store.saveLicence(added.licence, now), added.statement],
        status: 201,
        issuedToken: added.token,
      };
    }
    case "revokeToken": {
      if (!licence.tokens.some((token) => token.id === call.tokenId))
        throw new Refusal(404, "token not found");
      const next: RegistryLicence = {
        ...licence,
        tokens: licence.tokens.map((token) =>
          token.id === call.tokenId && token.revokedAt === null
            ? { ...token, revokedAt: now }
            : token,
        ),
      };
      return {
        licence: next,
        statements: [store.saveLicence(next, now), store.revokeTokens(next.id, call.tokenId, now)],
        status: 200,
        issuedToken: null,
      };
    }
  }
}

/** The stored answer of a replayed key, or 409 when the key came with another request. */
function replay(
  receipt: { fingerprint: string; status: number; body: string },
  fingerprint: string,
): Response {
  if (receipt.fingerprint !== fingerprint)
    return failure(409, "Idempotency-Key was used for another request");
  return json(JSON.parse(receipt.body), receipt.status, { "idempotent-replayed": "true" });
}

/**
 * The licence API.
 *
 * @param rest - the path segments after `/-/stackra/v1/licences`.
 * @example
 * // POST /-/stackra/v1/licences, Authorization: Bearer <issuer token>, Idempotency-Key: evt_123
 * await handleLicences(deps, request, []); // 201 { id: "lic_…", issuedToken: "stkl_…", … }
 */
export async function handleLicences(
  deps: RegistryDeps,
  request: Request,
  rest: readonly string[],
): Promise<Response> {
  const token = bearer(request.headers.get("authorization"));
  const issuer = token === null ? null : await deps.licenceStore.issuer(await sha256Hex(token));
  if (issuer === null)
    return failure(401, "an issuer token is required", {
      "www-authenticate": `Bearer realm="${deps.settings.host}"`,
    });
  const call = callOf(request.method, rest);
  if (call === null) return failure(404, "not_found");
  if ("allow" in call) return failure(405, "method not allowed", { allow: call.allow });
  const key = request.headers.get("idempotency-key");
  if (key === null || !IDEMPOTENCY_KEY.test(key))
    return failure(400, "Idempotency-Key is required (the OS event id)");

  const text = await request.text();
  const fingerprint = await sha256Hex(
    `${request.method} ${new URL(request.url).pathname}\n${text}`,
  );
  const stored = await deps.licenceStore.receipt(key);
  if (stored !== null) return replay(stored, fingerprint);

  const now = deps.now().toISOString();
  let outcome: Outcome;
  try {
    outcome = await outcomeOf(deps, call, objectOf(text), now);
  } catch (error) {
    if (error instanceof Refusal) return failure(error.status, error.message);
    throw error;
  }
  const body = JSON.stringify(outcome.licence);
  try {
    await deps.licenceStore.commit([
      ...outcome.statements,
      deps.licenceStore.saveReceipt(key, fingerprint, outcome.status, body, now),
      deps.licenceStore.audit(
        `licence.${call.action}`,
        outcome.licence.id,
        `issuer:${issuer}`,
        key,
        now,
      ),
    ]);
  } catch (error) {
    // A racing call with the same key committed first: answer as its replay.
    const raced = await deps.licenceStore.receipt(key);
    if (raced !== null) return replay(raced, fingerprint);
    throw error;
  }
  return json({ ...outcome.licence, issuedToken: outcome.issuedToken }, outcome.status);
}
