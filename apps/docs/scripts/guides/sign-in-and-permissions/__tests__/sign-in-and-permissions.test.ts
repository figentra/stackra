/**
 * Stackra file contract:
 * Purpose: the tests of the "Sign-in and permissions" guide's examples: a token the identity provider signed becomes
 *          the caller (`CallAuthenticator` in a host booted by `createApp`, keys from the memory JWKS driver), with
 *          its tenant from the token's scope; an expired token, a token for another audience and no token are each
 *          `unauthenticated`; then, through the real action pipeline with IAM's access control over grants held in
 *          memory, an agent closes any ticket of their tenant, a customer closes only their own (the policy), a
 *          signed-in user with no role and an agent of another tenant are `forbidden`, and nothing closes on a refusal.
 * Boundary: test only; a real Web Crypto ES256 key pair stands in for the provider's signing key, `support.access.ts`
 *           for gen's registrations, and a recording double for the ticket store.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0206 (decision 8: tokens verified by JWKS); ADR 0209 (decision 3); ADR 0098;
 *                     ADR 0138 as amended; ADR 0132; ADR 0208; STA-2852.
 */
import "./support.access";

import { ActionPipeline, type Resolver } from "@stackra/actions";
import { AccessControl } from "@stackra/actions/contracts";
import {
  BearerConfig,
  BearerTokenInvalidError,
  CallAuthenticator,
  createApp,
  MemoryJsonWebKeysDriver,
} from "@stackra/app/server";
import { JsonWebKeys } from "@stackra/app/contracts";
import { type AnyClass, Module, SystemClockDriver, type Wiring } from "@stackra/container";
import { type Actor, ActorKind, type PublicId, Realm, type ScopeRef } from "@stackra/contracts";
import { ForbiddenError, isRefusal } from "@stackra/errors";
import {
  connectPolicies,
  IamAccessControlDriver,
  MemoryPolicySourceDriver,
  PolicyDecisionPointService,
} from "@stackra/iam";
import { IDENTITY_CLAIMS } from "@stackra/identity";
import { MemoryScopeTreeDriver } from "@stackra/scope";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { CloseTicketAction } from "../close-ticket.action";
import { Ticket } from "../ticket.model";
import { TicketPolicy } from "../ticket.policy";
import type { TicketService } from "../ticket.service";

const ISSUER = "https://auth.support.example";
const AUDIENCE = "support-api";

const ROOT: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2r1", path: "platform" };
const ACME: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2a1", path: "platform.acme" };
const GLOBEX: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2g1", path: "platform.globex" };

const AGENT = "usr_01j9z3k4m5n6p7q8r9s0t1v2s1" as PublicId<"usr">;
const ADA = "usr_01j9z3k4m5n6p7q8r9s0t1v2c1" as PublicId<"usr">;
const BEN = "usr_01j9z3k4m5n6p7q8r9s0t1v2c2" as PublicId<"usr">;
const DREW = "usr_01j9z3k4m5n6p7q8r9s0t1v2c3" as PublicId<"usr">;
const GLOBEX_AGENT = "usr_01j9z3k4m5n6p7q8r9s0t1v2s2" as PublicId<"usr">;

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

/** The identity provider's signing key, as its JWKS endpoint would publish the public half. */
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

/** The claims of a token issued to `user`, a member of Acme, for Acme. */
function claimsOf(user: PublicId<"usr">, realm: Realm): Record<string, unknown> {
  const now = Math.floor(Date.now() / 1000);
  return {
    iss: ISSUER,
    aud: AUDIENCE,
    exp: now + 300,
    sub: `zitadel-${user}`,
    [IDENTITY_CLAIMS.userId]: user,
    [IDENTITY_CLAIMS.realm]: realm,
    [IDENTITY_CLAIMS.scopePath]: ACME.path,
    [IDENTITY_CLAIMS.memberships]: [{ scopeId: ACME.id, path: ACME.path, name: "Acme", roles: [] }],
  };
}

/** The provider's published keys. */
class ProviderKeys extends MemoryJsonWebKeysDriver {
  override keys = [publicKey];
}

class SupportModule extends Module({}) {}

/** Authenticates `authorization` in a host booted by `createApp`, as the generated auth handler does per call. */
async function authenticate(authorization?: string): Promise<Actor> {
  vi.stubEnv("STACKRA_BEARER_ISSUER", ISSUER);
  vi.stubEnv("STACKRA_BEARER_AUDIENCE", AUDIENCE);
  const wiring: Wiring = {
    member: "support",
    root: SupportModule,
    modules: { support: { exports: [], dependsOn: [], type: SupportModule } },
    config: [{ key: "app.bearer", provide: BearerConfig }],
    drivers: [
      {
        port: JsonWebKeys,
        key: "app.JsonWebKeys",
        candidates: { memory: async () => ProviderKeys },
      },
    ],
  };
  const app = await createApp(SupportModule, { wiring });
  try {
    const auth = await app.handlers.run((container) =>
      new CallAuthenticator(container).authenticate(
        authorization === undefined ? {} : { authorization },
      ),
    );
    return auth.actor;
  } finally {
    await app.close();
  }
}

/** A signed-in user of `realm`, as the server makes them from a verified token. */
const user = (id: PublicId<"usr">, realm: Realm): Actor => ({ kind: ActorKind.User, id, realm });

/** Whether `error` is the one `unauthenticated` refusal. */
const isUnauthenticated = (error: unknown): boolean => isRefusal(error, BearerTokenInvalidError);

/** Whether `error` is a `forbidden` refusal. */
const isForbidden = (error: unknown): boolean => isRefusal(error, ForbiddenError);

/** Ada's and Ben's tickets, and the ids the double closed. */
function ticketDesk() {
  const tickets = [
    Object.assign(new Ticket(), { id: "tkt_01j9z3k4m5n6p7q8r9s0t1v2t1", customerId: ADA }),
    Object.assign(new Ticket(), { id: "tkt_01j9z3k4m5n6p7q8r9s0t1v2t2", customerId: BEN }),
  ];
  const closed: string[] = [];
  const service = {
    get: async (id: string) => {
      const found = tickets.find((ticket) => ticket.id === id);
      if (found === undefined) throw new Error(`no ticket ${id}`);
      return found;
    },
    close: async (id: string) => {
      closed.push(id);
      return Object.assign(new Ticket(), {
        ...tickets.find((ticket) => ticket.id === id),
        status: "closed",
      });
    },
  } as unknown as TicketService;
  const [adas, bens] = tickets as [Ticket, Ticket];
  return { service, adas, bens, closed };
}

/** The action pipeline with IAM's access control over `source`, the scope tree holding Acme and Globex. */
function pipelineOver(source: MemoryPolicySourceDriver, tickets: TicketService): ActionPipeline {
  const clock = new SystemClockDriver();
  const tree = new MemoryScopeTreeDriver().seed([
    { ...ROOT, level: "platform", name: "Platform" },
    { ...ACME, level: "tenant", name: "Acme" },
    { ...GLOBEX, level: "tenant", name: "Globex" },
  ]);
  const bindings = new Map<AnyClass, object>([
    [
      AccessControl,
      new IamAccessControlDriver(new PolicyDecisionPointService(source, clock), tree),
    ],
    [CloseTicketAction, new CloseTicketAction(tickets)],
    [TicketPolicy, new TicketPolicy()],
  ]);
  const resolver: Resolver = {
    has: (token) => bindings.has(token),
    get: <T extends object>(token: AnyClass<T>) => bindings.get(token) as T,
  };
  connectPolicies(resolver);
  return new ActionPipeline(resolver);
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("Sign-in and permissions guide", { timeout: 60_000 }, () => {
  it("turns a signed token into the caller, in the tenant the token was issued for", async () => {
    // #region sign-in
    const token = await issue(claimsOf(AGENT, Realm.Staff));
    const caller = await authenticate(`Bearer ${token}`);
    expect(caller).toEqual({
      kind: ActorKind.User,
      id: AGENT,
      realm: Realm.Staff,
      scopeId: ACME.id,
    });
    // #endregion sign-in
  });

  it("refuses a missing, expired or foreign token as unauthenticated", async () => {
    // #region sign-in-refused
    const expired = await issue({ ...claimsOf(AGENT, Realm.Staff), exp: 1_700_000_000 });
    const foreign = await issue({ ...claimsOf(AGENT, Realm.Staff), aud: "another-api" });

    await expect(authenticate()).rejects.toSatisfy(isUnauthenticated);
    await expect(authenticate(`Bearer ${expired}`)).rejects.toSatisfy(isUnauthenticated);
    await expect(authenticate(`Bearer ${foreign}`)).rejects.toSatisfy(isUnauthenticated);
    // #endregion sign-in-refused
  });

  it("lets an agent close any ticket and a customer only their own, where their role is held", async () => {
    const desk = ticketDesk();
    // #region grants
    const policy = new MemoryPolicySourceDriver();
    policy.load({
      grants: [
        { principal: AGENT, role: "support.support_agent", scope: ACME },
        { principal: ADA, role: "support.ticket_requester", scope: ACME },
        { principal: BEN, role: "support.ticket_requester", scope: ACME },
        { principal: GLOBEX_AGENT, role: "support.support_agent", scope: GLOBEX },
      ],
    });
    // #endregion grants
    const pipeline = pipelineOver(policy, desk.service);
    const agent = user(AGENT, Realm.Staff);
    const ada = user(ADA, Realm.Customer);
    const drew = user(DREW, Realm.Customer);
    const globexAgent = user(GLOBEX_AGENT, Realm.Staff);

    // #region close
    const close = (actor: Actor, ticket: Ticket) =>
      pipeline.execute(CloseTicketAction, { ticketId: ticket.id }, { actor, scope: ACME });

    expect(await close(ada, desk.adas)).toEqual({ status: "closed" });
    expect(await close(agent, desk.bens)).toEqual({ status: "closed" });

    await expect(close(ada, desk.bens)).rejects.toSatisfy(isForbidden); // the policy: not hers
    await expect(close(drew, desk.adas)).rejects.toSatisfy(isForbidden); // no role at all
    await expect(close(globexAgent, desk.adas)).rejects.toSatisfy(isForbidden); // another tenant's agent
    // #endregion close

    expect(desk.closed).toEqual([desk.adas.id, desk.bens.id]);
  });

  it("refuses everyone when no grant is loaded: the permission step fails closed", async () => {
    const desk = ticketDesk();
    const pipeline = pipelineOver(new MemoryPolicySourceDriver(), desk.service);
    const agent: Actor = { kind: ActorKind.User, id: AGENT, realm: Realm.Staff };
    await expect(
      pipeline.execute(
        CloseTicketAction,
        { ticketId: desk.adas.id },
        { actor: agent, scope: ACME },
      ),
    ).rejects.toSatisfy(isForbidden);
    expect(desk.closed).toEqual([]);
  });
});
