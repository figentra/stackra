/**
 * Stackra file contract:
 * Purpose: sign-in in front of the example service: an access token the identity provider signed becomes the caller
 *          through `CallAuthenticator` over the service's own generated wiring (the step the generated Encore auth
 *          handler runs on every call), in the tenant the token was issued for; that caller then writes and reads a
 *          note through the real action pipeline. No token, an expired one and one for another API are each the one
 *          `unauthenticated` refusal, and the caller never comes from the request body.
 * Boundary: unit tier: the testing app is `createTestingModule` over the generated `ExampleModule` and wiring on the
 *           memory drivers, with the provider's published keys in a memory `JsonWebKeys` (a deployment binds the
 *           `oidc` driver, which reads the issuer's discovery document). A real Web Crypto ES256 key pair signs the
 *           tokens. The issuer and audience are layered onto `BearerConfig` as runway's values are in a deployment
 *           (`STACKRA_BEARER_ISSUER` and `STACKRA_BEARER_AUDIENCE` set the same fields); neither is a secret.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0206 (decision 8: tokens verified by JWKS); ADR 0209 (decision 3: one auth
 *                     handler); ADR 0098 (the actor comes from the credential); ADR 0269.
 */
import { run } from "@stackra/actions/testing";
import { JsonWebKeys } from "@stackra/app/contracts";
import {
  BearerConfig,
  BearerTokenInvalidError,
  CallAuthenticator,
  MemoryJsonWebKeysDriver,
} from "@stackra/app/server";
import { buildConfig } from "@stackra/config";
import { createTestingModule } from "@stackra/container/testing";
import { type Actor, ActorKind, type PublicId, Realm, type ScopeRef } from "@stackra/contracts";
import { isRefusal } from "@stackra/errors";
import { TEST_SCOPE_ID } from "@stackra/iam/testing";
import { SCOPE_PATH_CLAIM } from "@stackra/scope";
import { describe, expect, it } from "@stackra/testing";

import { CreateNoteAction } from "#modules/notes/actions/create-note.action";
import { ListNotesQuery } from "#modules/notes/queries/list-notes.query";
import type { ListNotesOutput } from "#modules/notes/schemas/list-notes-output.schema";
import type { NoteView } from "#modules/notes/schemas/note-view.schema";
import { ExampleModule } from "#stackra/module";

const ISSUER = "https://auth.example.test";
const AUDIENCE = "example-api";

/** The scope the tokens are issued for: the test tenant's. */
const SCOPE: ScopeRef = { id: TEST_SCOPE_ID, path: "platform.test" };

/**
 * The Stackra claims the identity provider's sign-in action adds to an access token (`IDENTITY_CLAIMS` of
 * `@stackra/identity`, which `CallAuthenticator` reads through `actorOf`); the scope path is `@stackra/scope`'s.
 */
const CLAIMS = {
  userId: "urn:stackra:user_id",
  realm: "urn:stackra:realm",
  memberships: "urn:stackra:memberships",
  scopePath: SCOPE_PATH_CLAIM,
} as const;

/** The signed-in user. */
const ADA = "usr_01j9z3k4m5n6p7q8r9s0t1v2a1" as PublicId<"usr">;

/** Base64url of bytes or of a JSON value. */
const b64 = (value: Uint8Array | object): string =>
  btoa(
    String.fromCodePoint(
      ...(value instanceof Uint8Array ? value : new TextEncoder().encode(JSON.stringify(value))),
    ),
  )
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");

/** The identity provider's signing key; its JWKS endpoint publishes the public half. */
const pair = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, [
  "sign",
  "verify",
]);
const publicKey = { ...(await crypto.subtle.exportKey("jwk", pair.publicKey)), kid: "k1" };

/** An ES256 access token over `claims`, as the provider issues one at sign-in. */
async function issue(claims: Record<string, unknown>): Promise<string> {
  const signing = `${b64({ alg: "ES256", kid: "k1", typ: "JWT" })}.${b64(claims)}`;
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    pair.privateKey,
    new TextEncoder().encode(signing),
  );
  return `${signing}.${b64(new Uint8Array(signature))}`;
}

/** The claims of a token issued to Ada, a member of the test tenant, for that tenant. */
function adaClaims(): Record<string, unknown> {
  const now = Math.floor(Date.now() / 1000);
  return {
    iss: ISSUER,
    aud: AUDIENCE,
    exp: now + 300,
    sub: `zitadel-${ADA}`,
    [CLAIMS.userId]: ADA,
    [CLAIMS.realm]: Realm.Staff,
    [CLAIMS.scopePath]: SCOPE.path,
    [CLAIMS.memberships]: [{ scopeId: SCOPE.id, path: SCOPE.path, name: "Test", roles: [] }],
  };
}

/** The provider's published keys, as the `oidc` driver would read them. */
class ProviderKeys extends MemoryJsonWebKeysDriver {
  override keys = [publicKey];
}

/** The example service's testing app, trusting the provider's issuer and keys for this API's audience. */
async function compile() {
  return createTestingModule(ExampleModule)
    .useDrivers("memory")
    .useDrivers({ EventPublisher: "inbox" })
    .override(
      BearerConfig,
      buildConfig(BearerConfig, { values: { issuer: ISSUER, audience: AUDIENCE } }),
    )
    .override(JsonWebKeys, new ProviderKeys())
    .compile();
}

/** The caller of a call that sent `authorization`, as the generated auth handler finds it. */
async function callerOf(authorization?: string): Promise<Actor> {
  const app = await compile();
  const auth = await new CallAuthenticator(app).authenticate(
    authorization === undefined ? {} : { authorization },
  );
  return auth.actor;
}

/** Whether `error` is the one `unauthenticated` refusal. */
const isUnauthenticated = (error: unknown): boolean => isRefusal(error, BearerTokenInvalidError);

describe("sign-in in front of the example service", { timeout: 120_000 }, () => {
  it("turns a signed token into the caller, in the tenant it was issued for, who then writes and reads", async () => {
    // #region sign-in
    const caller = await callerOf(`Bearer ${await issue(adaClaims())}`);
    expect(caller).toEqual({
      kind: ActorKind.User,
      id: ADA,
      realm: Realm.Staff,
      scopeId: SCOPE.id,
    });
    // #endregion sign-in

    const created = await run(
      CreateNoteAction,
      { title: "Signed in" },
      { as: caller, idempotencyKey: "signed-in-1" },
    );
    expect(created.ok).toBe(true);
    const listed = await run(ListNotesQuery, {}, { as: caller });
    expect((listed.output as ListNotesOutput).items.map((note) => note.id)).toEqual([
      (created.output as NoteView).id,
    ]);
  });

  it("refuses a missing, expired or foreign token as unauthenticated", async () => {
    const expired = await issue({ ...adaClaims(), exp: 1_700_000_000 });
    const foreign = await issue({ ...adaClaims(), aud: "another-api" });
    const forged = `${(await issue(adaClaims())).slice(0, -4)}AAAA`;

    await expect(callerOf()).rejects.toSatisfy(isUnauthenticated);
    await expect(callerOf(`Bearer ${expired}`)).rejects.toSatisfy(isUnauthenticated);
    await expect(callerOf(`Bearer ${foreign}`)).rejects.toSatisfy(isUnauthenticated);
    await expect(callerOf(`Bearer ${forged}`)).rejects.toSatisfy(isUnauthenticated);
  });
});
