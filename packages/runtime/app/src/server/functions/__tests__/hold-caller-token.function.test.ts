/**
 * Stackra file contract:
 * Purpose: unit tests of `holdCallerToken` with `ServiceClientSessionDriver` behind a generated client's HTTP
 *          transport: a user's call (the first hop) forwards the user's bearer token; a service calling for a user
 *          forwards the user's token only into an action that declares `onBehalfOf: { secondHop: true }`, and into any
 *          other action its outgoing calls carry the service token alone (one hop); an anonymous, agent or lone
 *          service call holds nothing; the holder is empty once the call ends and never reaches a concurrent call; the
 *          headers are read in any case, from a `Headers` or a record, and a repeated header holds nothing; a
 *          `stream: true` action's call holds the token until its stream ends or its reader cancels it; and through
 *          the action pipeline no token reaches the call's context, its actor, its audit entry, a log line or the
 *          console.
 * Boundary: test only; the tokens are throwaway strings (nothing here verifies one: `CallAuthenticator` does, and its
 *           own tests cover it), `fetch` is stubbed and the pipeline's permission step allows every call.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0209 (decision 3 and its 2026-11-07 amendment, conditions 4 and 5).
 */
import { inspect } from "node:util";

import { Action, ActionPipeline, Idempotency, registerActions } from "@stackra/actions";
import type { ActionContext, Resolver } from "@stackra/actions";
import { AccessControl, AuditTrail } from "@stackra/actions/contracts";
import type { AuditEntry } from "@stackra/actions/contracts";
import { ClientsConfig, HttpClientTransportDriver } from "@stackra/clients";
import type { ClientRequest } from "@stackra/clients/contracts";
import { buildConfig } from "@stackra/config";
import { type AnyClass, Driver } from "@stackra/container";
import { ActorKind, HttpMethod, Logger, Realm } from "@stackra/contracts";
import type { Actor } from "@stackra/contracts";
import { MemoryServiceTokensDriver } from "@stackra/identity";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";
import { z } from "zod";

import { ON_BEHALF_OF_TOKEN } from "#server/constants/on-behalf-of-token.constant";
import { ServiceClientSessionDriver } from "#server/drivers/service-client-session.driver";
import { holdCallerToken } from "#server/functions/hold-caller-token.function";

const USER_TOKEN = "throwaway-user-token";
const FORWARDED_TOKEN = "throwaway-forwarded-token";
const SERVICE_TOKEN = "throwaway-service-token";
const TOKENS = [USER_TOKEN, FORWARDED_TOKEN, SERVICE_TOKEN];

const user: Actor = {
  kind: ActorKind.User,
  id: "usr_01j9z3k4m5n6p7q8r9s0t1v2w3",
  realm: Realm.Customer,
};
const service: Actor = { kind: ActorKind.Service, id: "svc_01j9z3k4m5n6p7q8r9s0t1v2w5" };
const serviceForUser: Actor = { ...service, onBehalfOf: user };

/** An action that keeps the user's token to itself: one hop. */
class PostSettlementAction extends Action({
  key: "cod_settlement.post",
  actors: [ActorKind.Service],
}) {
  async handle(): Promise<void> {}
}

/** An action that lets a service forward the user's token once more. */
class IssueBalanceAction extends Action({
  key: "balance.issue",
  actors: [ActorKind.Service],
  onBehalfOf: { secondHop: true },
}) {
  async handle(): Promise<void> {}
}

/** An action whose answer is a stream: its call ends when the stream does. */
class SendMessageAction extends Action({
  key: "message.send",
  actors: [ActorKind.User],
  stream: true,
  tool: false,
  idempotency: Idempotency.Never,
}) {
  async handle(): Promise<void> {}
}

/** Pay's ledger post, as a generated client sends it. */
const ledgerPost: ClientRequest = {
  key: "pay.ledger.post@1",
  kind: "action",
  endpoint: { method: HttpMethod.Post, path: "/ledger/posts" },
  input: { amount: 100 },
  output: z.object({ posted: z.boolean() }),
};

/** The generated clients' HTTP transport over a service's session, as a service binds it. */
function transport(): HttpClientTransportDriver {
  const config = buildConfig(ClientsConfig, {
    values: { baseUrl: "https://pay.internal", audiences: { pay: "pay-project" } },
  });
  const tokens = new MemoryServiceTokensDriver().seed({ "pay-project": SERVICE_TOKEN });
  return new HttpClientTransportDriver(config, new ServiceClientSessionDriver(tokens, config));
}

/** Stubs `fetch` to answer a posted ledger entry and returns the requests it saw. */
function stubFetch(): Request[] {
  const seen: Request[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn((request: Request) => {
      seen.push(request);
      return Promise.resolve(Response.json({ posted: true }));
    }),
  );
  return seen;
}

/** The headers a call made with `headers` by `actor` into `action` sends to Pay. */
async function outgoing(
  headers: Readonly<Record<string, string>>,
  actor: Actor,
  action: object,
): Promise<Headers> {
  const seen = stubFetch();
  await holdCallerToken(headers, actor, action, () => transport().send(ledgerPost));
  return seen[0]?.headers ?? new Headers();
}

/** What the running call holds, read inside `holdCallerToken`. */
const heldBy = (
  headers: Headers | Readonly<Record<string, string | string[]>>,
  actor: Actor,
  action: object = PostSettlementAction,
) => holdCallerToken(headers, actor, action, async () => ON_BEHALF_OF_TOKEN.getStore()?.());

describe(holdCallerToken, () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("forwards a user's own bearer token on the first hop", async () => {
    const sent = await outgoing(
      { authorization: `Bearer ${USER_TOKEN}` },
      user,
      PostSettlementAction,
    );
    expect(sent.get("Authorization")).toBe(`Bearer ${SERVICE_TOKEN}`);
    expect(sent.get("Stackra-On-Behalf-Of")).toBe(USER_TOKEN);
  });

  it("keeps a forwarded token to one hop unless the action allows a second", async () => {
    const credentials = {
      authorization: `Bearer ${SERVICE_TOKEN}`,
      "stackra-on-behalf-of": FORWARDED_TOKEN,
    };
    const oneHop = await outgoing(credentials, serviceForUser, PostSettlementAction);
    expect(oneHop.get("Authorization")).toBe(`Bearer ${SERVICE_TOKEN}`);
    expect(oneHop.has("Stackra-On-Behalf-Of")).toBe(false);
    const secondHop = await outgoing(credentials, serviceForUser, IssueBalanceAction);
    expect(secondHop.get("Stackra-On-Behalf-Of")).toBe(FORWARDED_TOKEN);
  });

  it("holds nothing for an anonymous, agent or lone service call, nor a forward with no user", async () => {
    const credentials = {
      authorization: `Bearer ${USER_TOKEN}`,
      "stackra-on-behalf-of": FORWARDED_TOKEN,
    };
    const agent: Actor = {
      kind: ActorKind.Agent,
      id: "agt_01j9z3k4m5n6p7q8r9s0t1v2w3",
      onBehalfOf: user,
    };
    for (const actor of [
      { kind: ActorKind.Anonymous, id: "anon_01j9z3k4m5n6p7q8r9s0t1v2w3" } as Actor,
      agent,
      service,
      { ...service, onBehalfOf: agent },
    ])
      expect(await heldBy(credentials, actor, IssueBalanceAction)).toBeUndefined();
    const sent = await outgoing(
      { authorization: `Bearer ${SERVICE_TOKEN}` },
      service,
      IssueBalanceAction,
    );
    expect(sent.has("Stackra-On-Behalf-Of")).toBe(false);
  });

  it("reads the headers in any case, from Headers or a record, and holds nothing for a repeated one", async () => {
    expect(await heldBy({ Authorization: `bearer ${USER_TOKEN}` }, user)).toBe(USER_TOKEN);
    expect(await heldBy(new Headers({ authorization: `Bearer ${USER_TOKEN}` }), user)).toBe(
      USER_TOKEN,
    );
    expect(
      await heldBy({ authorization: [`Bearer ${USER_TOKEN}`, "Bearer other"] }, user),
    ).toBeUndefined();
    expect(await heldBy({ authorization: "Basic dTpw" }, user)).toBeUndefined();
    expect(
      await heldBy(
        { "Stackra-On-Behalf-Of": ` ${FORWARDED_TOKEN} ` },
        serviceForUser,
        IssueBalanceAction,
      ),
    ).toBe(FORWARDED_TOKEN);
  });

  it("empties the holder when the call ends and never shows it to a concurrent call", async () => {
    let reader: (() => string | undefined) | undefined;
    let release: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const first = holdCallerToken(
      { authorization: `Bearer ${USER_TOKEN}` },
      user,
      PostSettlementAction,
      async () => {
        reader = ON_BEHALF_OF_TOKEN.getStore();
        await gate;
        return reader?.();
      },
    );
    const second = heldBy({}, service);
    release?.();
    expect(await first).toBe(USER_TOKEN);
    expect(await second).toBeUndefined();
    // work the call left running reads nothing once it ended
    expect(reader?.()).toBeUndefined();
    expect(ON_BEHALF_OF_TOKEN.getStore()).toBeUndefined();
  });

  /** The loop writing a streamed answer forwards the token while the caller listens, and never after the end. */
  it("holds a streamed call's token until its stream ends", async () => {
    let reader: (() => string | undefined) | undefined;
    let write: ((chunk: string) => void) | undefined;
    let end: (() => void) | undefined;
    const answer = await holdCallerToken(
      { authorization: `Bearer ${USER_TOKEN}` },
      user,
      SendMessageAction,
      async () => {
        reader = ON_BEHALF_OF_TOKEN.getStore();
        return new ReadableStream<string>({
          start(controller) {
            write = (chunk) => controller.enqueue(chunk);
            end = () => controller.close();
          },
        });
      },
    );
    expect(answer).toBeInstanceOf(ReadableStream);
    const chunks = (answer as ReadableStream<string>).getReader();
    write?.("a");
    expect(await chunks.read()).toEqual({ done: false, value: "a" });
    // handle has returned, and the stream is still open: the loop still forwards the token
    expect(reader?.()).toBe(USER_TOKEN);
    end?.();
    expect((await chunks.read()).done).toBe(true);
    expect(reader?.()).toBeUndefined();
  });

  /** A caller that goes away ends the call too. */
  it("empties a streamed call's holder when its reader cancels", async () => {
    let reader: (() => string | undefined) | undefined;
    const cancelled = vi.fn();
    const answer = await holdCallerToken(
      { authorization: `Bearer ${USER_TOKEN}` },
      user,
      SendMessageAction,
      async () => {
        reader = ON_BEHALF_OF_TOKEN.getStore();
        return new ReadableStream<string>({ cancel: cancelled });
      },
    );
    expect(reader?.()).toBe(USER_TOKEN);
    await (answer as ReadableStream<string>).cancel("gone");
    expect(reader?.()).toBeUndefined();
    expect(cancelled).toHaveBeenCalledWith("gone");
  });

  /** Only a `stream: true` action is held past `handle`: another action's stream output ends the call as usual. */
  it("empties the holder at once when the action does not stream", async () => {
    let reader: (() => string | undefined) | undefined;
    await holdCallerToken(
      { authorization: `Bearer ${USER_TOKEN}` },
      user,
      PostSettlementAction,
      async () => {
        reader = ON_BEHALF_OF_TOKEN.getStore();
        return new ReadableStream<string>();
      },
    );
    expect(reader?.()).toBeUndefined();
  });
});

describe("holdCallerToken through the action pipeline", () => {
  /** Allows every call: the permission step is not what these tests prove. */
  class AllowAll extends Driver(AccessControl) {
    async require(): Promise<void> {}

    async authorize(): Promise<void> {}
  }

  /** Keeps every audit entry. */
  class CapturingAuditTrail extends Driver(AuditTrail) {
    readonly entries: AuditEntry[] = [];

    async record(entry: AuditEntry): Promise<void> {
      this.entries.push(entry);
    }
  }

  /** Keeps every log line. */
  class CapturingLogger extends Driver(Logger) {
    readonly lines: unknown[] = [];

    debug(event: string, fields?: object): void {
      this.lines.push([event, fields]);
    }

    info(event: string, fields?: object): void {
      this.lines.push([event, fields]);
    }

    warn(event: string, fields?: object): void {
      this.lines.push([event, fields]);
    }

    error(event: string, fields?: object): void {
      this.lines.push([event, fields]);
    }
  }

  let seenCtx: ActionContext | undefined;

  /** Settles a COD order and posts it to Pay's ledger through the generated client's transport. */
  class SettleAction extends Action({
    key: "cod_settlement.settle",
    actors: [ActorKind.Service],
    onBehalfOf: { secondHop: true },
  }) {
    async handle(_input: object, ctx: ActionContext): Promise<string> {
      seenCtx = ctx;
      await transport().send(ledgerPost);
      return "settled";
    }
  }

  beforeEach(() => {
    seenCtx = undefined;
    registerActions([
      {
        type: SettleAction,
        key: "ship.cod_settlement.settle@1",
        permission: "ship.cod_settlement.settle",
      },
    ]);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("forwards the token on the wire and puts it in no context, actor, audit entry, log line or console output", async () => {
    const printed: string[] = [];
    const keep = (...parts: unknown[]) => {
      printed.push(parts.map((part) => inspect(part, { depth: 8 })).join(" "));
    };
    for (const method of ["log", "info", "warn", "error", "debug"] as const)
      vi.spyOn(console, method).mockImplementation(keep);
    const audit = new CapturingAuditTrail();
    const logger = new CapturingLogger();
    const bindings = new Map<AnyClass, object>([
      [AccessControl, new AllowAll()],
      [AuditTrail, audit],
      [Logger, logger],
      [SettleAction, new SettleAction()],
    ]);
    const resolver: Resolver = {
      has: (token) => bindings.has(token),
      get: <U extends object>(token: AnyClass<U>) => bindings.get(token) as U,
    };
    const seen = stubFetch();
    const credentials = {
      authorization: `Bearer ${SERVICE_TOKEN}`,
      "stackra-on-behalf-of": FORWARDED_TOKEN,
    };

    const answer = await holdCallerToken(credentials, serviceForUser, SettleAction, () =>
      new ActionPipeline(resolver).execute(SettleAction, {}, { actor: serviceForUser }),
    );

    expect(answer).toBe("settled");
    expect(seen[0]?.headers.get("Stackra-On-Behalf-Of")).toBe(FORWARDED_TOKEN);
    expect(seenCtx).toBeDefined();
    expect(audit.entries.length).toBeGreaterThan(0);
    const told = [
      inspect(seenCtx, { depth: 8, showHidden: true }),
      inspect(seenCtx?.actor, { depth: 8, showHidden: true }),
      JSON.stringify(seenCtx?.actor),
      inspect(audit.entries, { depth: 8, showHidden: true }),
      inspect(logger.lines, { depth: 8, showHidden: true }),
      ...printed,
    ].join("\n");
    for (const token of TOKENS) expect(told).not.toContain(token);
  });
});
