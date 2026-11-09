/**
 * Stackra file contract:
 * Purpose: the integration test of a service-to-service call on real Postgres (STA-2558's done-when), from the two
 *          tokens to the handler: `CallAuthenticator` verifies a service bearer and the user token it forwards,
 *          `holdCallerToken` holds what the action may forward, and the action pipeline checks both grants
 *          (`IamAccessControlDriver`) and runs the call in the user's tenant (`CallIsolationDriver`). The allowed
 *          service key (`ship.shipping`) passes and its handler runs with `app.tenant_id` set to the tenant; any other
 *          key is refused; a call for a user of another tenant is refused; and a call with no service token (only the
 *          forwarded user token, or a user's own bearer into a service-only action) is refused.
 * Boundary: integration tier (`.int`): needs Postgres for `usePostgres`. The tokens are signed with a throwaway Web
 *           Crypto RS256 key pair made here; the principals, grants and scope tree are in memory.
 * Runtime: node (vitest)
 * Governing contract: ADR 0209 (decision 3 and its 2026-11-07 amendment); ADR 0495 (call isolation); ADR 0182
 *                     (integration tier); ADR 0022; ADR 0269.
 */
import { Action, ActionPipeline, registerActions } from "@stackra/actions";
import type { Resolver } from "@stackra/actions";
import { AccessControl, CallIsolation, UnitOfWork } from "@stackra/actions/contracts";
import { Module, SystemClockDriver } from "@stackra/container";
import type { AnyClass, Wiring } from "@stackra/container";
import { ActorKind, Realm } from "@stackra/contracts";
import type { ScopeRef } from "@stackra/contracts";
import { DatabaseUnitOfWorkDriver } from "@stackra/database/node";
import { usePostgres } from "@stackra/database/testing";
import { ForbiddenError, isRefusal } from "@stackra/errors";
import {
  IamAccessControlDriver,
  MemoryPolicySourceDriver,
  PolicyDecisionPointService,
} from "@stackra/iam";
import { IDENTITY_CLAIMS, MemoryServicePrincipalsDriver } from "@stackra/identity";
import { ServicePrincipals } from "@stackra/identity/contracts";
import { MemoryScopeTreeDriver } from "@stackra/scope";
import { TenantScopeMismatchError } from "@stackra/tenancy";
import { CallIsolationDriver, TenantIsolationService } from "@stackra/tenancy/node";
import { afterEach, beforeAll, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { BearerConfig } from "#config/bearer.config";
import { JsonWebKeys } from "#contracts/ports/json-web-keys.port";
import { MemoryJsonWebKeysDriver } from "#server/drivers/memory-json-web-keys.driver";
import { BearerTokenInvalidError } from "#server/errors/bearer-token-invalid.error";
import { createApp } from "#server/functions/create-app.function";
import { holdCallerToken } from "#server/functions/hold-caller-token.function";
import { CallAuthenticator } from "#server/services/call-authenticator.service";
import type { CallCredentials } from "#server/types/call-credentials.type";

const ISSUER = "https://auth.example.test";
const AUDIENCE = "pay-project";

const ROOT: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2r1", path: "platform" };
const ACME: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2a1", path: "platform.acme" };
const GLOBEX: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2b1", path: "platform.globex" };

const USER_ID = "usr_01j9z3k4m5n6p7q8r9s0t1v2w3";
const SHIPPING_ID = "svc_01j9z3k4m5n6p7q8r9s0t1v2w5";
const ORDERS_ID = "svc_01j9z3k4m5n6p7q8r9s0t1v2w6";
const SHIPPING_SUBJECT = "312909075212468001";
const ORDERS_SUBJECT = "312909075212468002";

const b64 = (value: Uint8Array | object): string =>
  btoa(
    String.fromCodePoint(
      ...(value instanceof Uint8Array ? value : new TextEncoder().encode(JSON.stringify(value))),
    ),
  )
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");

const pair = await crypto.subtle.generateKey(
  {
    name: "RSASSA-PKCS1-v1_5",
    modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: "SHA-256",
  },
  true,
  ["sign", "verify"],
);
const publicKey = { ...(await crypto.subtle.exportKey("jwk", pair.publicKey)), kid: "k1" };

/** An RS256 token under key `k1`. */
async function token(claims: Record<string, unknown>): Promise<string> {
  const signing = `${b64({ alg: "RS256", kid: "k1" })}.${b64(claims)}`;
  const mac = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    pair.privateKey,
    new TextEncoder().encode(signing),
  );
  return `${signing}.${b64(new Uint8Array(mac))}`;
}

const base = { iss: ISSUER, aud: AUDIENCE, exp: Math.floor(Date.now() / 1000) + 300 };

/** A service account's bearer header. */
const serviceBearer = async (subject: string) =>
  `Bearer ${await token({ ...base, sub: subject, client_id: subject })}`;

/** A customer's own access token, issued in `scope`. */
const userToken = (scope: ScopeRef) =>
  token({
    ...base,
    sub: "312909075212468632",
    [IDENTITY_CLAIMS.userId]: USER_ID,
    [IDENTITY_CLAIMS.realm]: Realm.Customer,
    [IDENTITY_CLAIMS.scopePath]: scope.path,
    [IDENTITY_CLAIMS.memberships]: [
      { scopeId: scope.id, path: scope.path, name: "Acme or Globex", roles: ["customer"] },
    ],
  });

/** The issuer's one key. */
class TestKeys extends MemoryJsonWebKeysDriver {
  override keys = [publicKey];
}

/** Ship's shipping service and Commerce's orders service, both bound to Acme. */
class SeededPrincipals extends MemoryServicePrincipalsDriver {
  constructor() {
    super();
    this.seed({
      [SHIPPING_SUBJECT]: { id: SHIPPING_ID, key: "ship.shipping", scopeId: ACME.id },
      [ORDERS_SUBJECT]: { id: ORDERS_ID, key: "commerce.orders", scopeId: ACME.id },
    });
  }
}

class PayModule extends Module({}) {}

const postgres = usePostgres({ entities: [] });

/** Posts a COD settlement; answers the tenant its unit of work runs in. */
class PostSettlementAction extends Action({
  key: "cod_settlement.post",
  actors: [ActorKind.Service],
}) {
  async handle(): Promise<string> {
    const [row] = (await postgres.database
      .em()
      .execute("select current_setting('app.tenant_id', true) as acting")) as {
      acting: string | null;
    }[];
    return row?.acting ?? "";
  }
}

/** The pipeline over the real decision point, isolation and unit of work: Shipping and the user hold the grant at Acme. */
function pipelineOf(): ActionPipeline {
  const { database } = postgres;
  const tree = new MemoryScopeTreeDriver().seed([
    { ...ROOT, level: "platform", name: "Platform" },
    { ...ACME, level: "tenant", name: "Acme" },
    { ...GLOBEX, level: "tenant", name: "Globex" },
  ]);
  const source = new MemoryPolicySourceDriver();
  source.load({
    grants: [
      { principal: SHIPPING_ID, role: "cod_settler", scope: ACME },
      { principal: USER_ID, role: "cod_settler", scope: ACME },
      { principal: USER_ID, role: "cod_settler", scope: GLOBEX },
    ],
    roles: { cod_settler: ["pay.cod_settlement.post"] },
  });
  const bound = new Map<AnyClass, object>([
    [
      AccessControl,
      new IamAccessControlDriver(
        new PolicyDecisionPointService(source, new SystemClockDriver()),
        tree,
      ),
    ],
    [UnitOfWork, new DatabaseUnitOfWorkDriver()],
    [CallIsolation, new CallIsolationDriver(database, new TenantIsolationService(database), tree)],
    [PostSettlementAction, new PostSettlementAction()],
  ]);
  const resolver: Resolver = {
    has: (type) => bound.has(type),
    get: <U extends object>(type: AnyClass<U>) => bound.get(type) as U,
  };
  return new ActionPipeline(resolver);
}

/** Makes one call with `credentials` to Pay, as the generated adapter does: authenticate, hold, run. */
async function call(credentials: CallCredentials): Promise<unknown> {
  vi.stubEnv("STACKRA_BEARER_ISSUER", ISSUER);
  vi.stubEnv("STACKRA_BEARER_AUDIENCE", AUDIENCE);
  const wiring: Wiring = {
    member: "pay",
    root: PayModule,
    modules: { pay: { exports: [], dependsOn: [], type: PayModule } },
    config: [{ key: "app.bearer", provide: BearerConfig }],
    drivers: [
      { port: JsonWebKeys, key: "app.JsonWebKeys", candidates: { memory: async () => TestKeys } },
      {
        port: ServicePrincipals,
        key: "identity.ServicePrincipals",
        candidates: { memory: async () => SeededPrincipals },
      },
    ],
  };
  const app = await createApp(PayModule, { wiring });
  try {
    return await app.handlers.run(async (container) => {
      const { actor } = await new CallAuthenticator(container).authenticate(credentials);
      const headers = {
        ...(credentials.authorization === undefined
          ? {}
          : { authorization: credentials.authorization }),
        ...(credentials.onBehalfOf === undefined
          ? {}
          : { "stackra-on-behalf-of": credentials.onBehalfOf }),
      };
      return holdCallerToken(headers, actor, PostSettlementAction, () =>
        pipelineOf().execute(PostSettlementAction, {}, { actor }),
      );
    });
  } finally {
    await app.close();
  }
}

/** The refusal `credentials` get, or undefined when the call passes. */
const refusalOf = (credentials: CallCredentials) =>
  call(credentials).then(
    () => undefined,
    (error: unknown) => error,
  );

beforeAll(() => {
  registerActions([
    {
      type: PostSettlementAction,
      key: "pay.cod_settlement.post@1",
      permission: "pay.cod_settlement.post",
    },
  ]);
});

describe("a service-to-service call on Postgres", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("passes the allowed key for a user of its tenant, and runs in that tenant", async () => {
    expect(
      await call({
        authorization: await serviceBearer(SHIPPING_SUBJECT),
        onBehalfOf: await userToken(ACME),
      }),
    ).toBe(ACME.id);
  });

  it("refuses any other key, even for the same user and tenant", async () => {
    const refusal = await refusalOf({
      authorization: await serviceBearer(ORDERS_SUBJECT),
      onBehalfOf: await userToken(ACME),
    });
    expect(isRefusal(refusal, ForbiddenError)).toBe(true);
  });

  it("refuses the allowed key calling for a user of another tenant", async () => {
    const refusal = await refusalOf({
      authorization: await serviceBearer(SHIPPING_SUBJECT),
      onBehalfOf: await userToken(GLOBEX),
    });
    expect(isRefusal(refusal, TenantScopeMismatchError)).toBe(true);
  });

  it("refuses a call with no service token", async () => {
    const forwardedOnly = await refusalOf({ onBehalfOf: await userToken(ACME) });
    expect(isRefusal(forwardedOnly, BearerTokenInvalidError)).toBe(true);
    const userOnly = await refusalOf({ authorization: `Bearer ${await userToken(ACME)}` });
    expect(isRefusal(userOnly, ForbiddenError)).toBe(true);
  });
});
