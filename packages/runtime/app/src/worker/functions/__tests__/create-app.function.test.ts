/**
 * Stackra file contract:
 * Purpose: unit tests of the Worker `createApp`: `fetch` validates the env, boots once per isolate, hands the
 *          member's context factory the request, env, ctx, a request container and the reporter, and runs the router
 *          with that context; a bad env, a failed boot or a router throw is reported once and answered with the crash
 *          page (500, `no-store`), a failed boot is retried by the next request, and the request container carries
 *          the request's session for `ctx.session` before the factory sees it.
 * Boundary: test only; React Router's request handler is mocked.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0295 (decision 8); ADR 0297; ADR 0457.
 */
import { Driver } from "@stackra/container";
import type { Container, Wiring } from "@stackra/container";
import { ErrorReporter } from "@stackra/errors/contracts";
import { SessionStore } from "@stackra/identity/contracts";
import type { SessionUser } from "@stackra/identity/contracts";
import { beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";
import { RouterContextProvider } from "react-router";
import type * as ReactRouter from "react-router";
import type { ServerBuild } from "react-router";

import { routeSessionPart } from "#core/functions/route-session-part.function";
import { createApp } from "#worker/functions/create-app.function";
import type { WorkerExecutionContext } from "#worker/types/worker-execution-context.type";
import type { WorkerRequest } from "#worker/types/worker-request.type";

const routerHandler = vi.fn<(request: Request, context?: unknown) => Promise<Response>>();

vi.mock("react-router", async (importOriginal) => ({
  ...(await importOriginal<typeof ReactRouter>()),
  createRequestHandler: () => routerHandler,
}));

class MemoryErrorReporterDriver extends Driver(ErrorReporter) {
  static readonly errors: unknown[] = [];

  report(error: unknown): void {
    MemoryErrorReporterDriver.errors.push(error);
  }
}

const wiring: Wiring = {
  member: "@acme/web",
  root: "web",
  drivers: [
    {
      port: ErrorReporter,
      candidates: { memory: () => Promise.resolve(MemoryErrorReporterDriver) },
    },
  ],
};

const ctx: WorkerExecutionContext = {
  waitUntil: () => undefined,
  passThroughOnException: () => undefined,
  props: {},
};

const build = (): Promise<ServerBuild> => Promise.resolve({} as ServerBuild);

describe("createApp (worker)", () => {
  beforeEach(() => {
    routerHandler.mockReset();
    MemoryErrorReporterDriver.errors.length = 0;
  });

  it("runs the router with the context the factory filled", async () => {
    routerHandler.mockResolvedValue(new Response("page"));
    const seen: WorkerRequest<{ site: string }>[] = [];
    const context = new RouterContextProvider();
    const app = await createApp(wiring, {
      env: (raw) => ({ site: String((raw as Record<string, unknown>)["STACKRA_SITE_URL"]) }),
      build,
      context: (request) => {
        seen.push(request);
        return context;
      },
      crashPage: "<p>crash</p>",
    });
    const request = new Request("https://acme.example/");
    const response = await app.fetch(request, { STACKRA_SITE_URL: "https://acme.example" }, ctx);
    await expect(response.text()).resolves.toBe("page");
    expect(routerHandler).toHaveBeenCalledWith(request, context);
    const [first] = seen;
    expect(first?.env).toEqual({ site: "https://acme.example" });
    expect(first?.request).toBe(request);
    expect(first?.ctx).toBe(ctx);
    expect(first?.reporter).toBeInstanceOf(MemoryErrorReporterDriver);
  });

  it("boots once per isolate and gives each request its own container", async () => {
    routerHandler.mockImplementation(() => Promise.resolve(new Response("ok")));
    const containers: unknown[] = [];
    const app = await createApp(wiring, {
      env: () => ({}),
      build,
      context: (request) => {
        containers.push(request.container);
        return new RouterContextProvider();
      },
      crashPage: "crash",
    });
    await app.fetch(new Request("https://acme.example/a"), {}, ctx);
    await app.fetch(new Request("https://acme.example/b"), {}, ctx);
    expect(containers).toHaveLength(2);
    expect(containers[0]).not.toBe(containers[1]);
  });

  it("loads the request's session into its request container", async () => {
    routerHandler.mockResolvedValue(new Response("ok"));
    const user = { userId: "usr_01j9z3k4m5n6p7q8r9s0t1v2w3" } as unknown as SessionUser;
    class CookieSessionStoreDriver extends Driver(SessionStore) {
      async load(): Promise<SessionUser | null> {
        return user;
      }

      async signIn(): Promise<void> {}

      async signOut(): Promise<void> {}

      async accessToken(): Promise<string | undefined> {
        return undefined;
      }
    }
    const containers: Container[] = [];
    const app = await createApp(
      {
        ...wiring,
        drivers: [
          ...(wiring.drivers ?? []),
          {
            port: SessionStore,
            candidates: { cookie: () => Promise.resolve(CookieSessionStoreDriver) },
          },
        ],
      },
      {
        env: () => ({}),
        build,
        context: (request) => {
          containers.push(request.container);
          return new RouterContextProvider();
        },
        crashPage: "crash",
      },
    );
    const request = new Request("https://acme.example/account");
    await app.fetch(request, {}, ctx);
    const [container] = containers;
    expect(routeSessionPart({ request, container }).session).toBe(user);
  });

  it("answers a bad env with the crash page and reports it", async () => {
    const write = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const app = await createApp(wiring, {
      env: () => {
        throw new Error("STACKRA_SITE_URL is missing");
      },
      build,
      context: () => new RouterContextProvider(),
      crashPage: "<p>crash</p>",
    });
    const response = await app.fetch(new Request("https://acme.example/"), {}, ctx);
    expect(response.status).toBe(500);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("content-type")).toContain("text/html");
    await expect(response.text()).resolves.toBe("<p>crash</p>");
    expect(write).toHaveBeenCalledOnce();
    write.mockRestore();
  });

  it("reports a router throw to the bound reporter", async () => {
    const failure = new Error("render failed");
    routerHandler.mockRejectedValue(failure);
    const app = await createApp(wiring, {
      env: () => ({}),
      build,
      context: () => new RouterContextProvider(),
      crashPage: "crash",
    });
    const response = await app.fetch(new Request("https://acme.example/"), {}, ctx);
    expect(response.status).toBe(500);
    expect(MemoryErrorReporterDriver.errors).toEqual([failure]);
  });

  it("retries a failed boot on the next request", async () => {
    const write = vi.spyOn(console, "error").mockImplementation(() => undefined);
    routerHandler.mockResolvedValue(new Response("ok"));
    let attempts = 0;
    const flaky: Wiring = {
      member: "@acme/web",
      drivers: [
        {
          port: ErrorReporter,
          candidates: {
            memory: () =>
              (attempts += 1) === 1
                ? Promise.reject(new Error("driver load failed"))
                : Promise.resolve(MemoryErrorReporterDriver),
          },
        },
      ],
    };
    const app = await createApp(flaky, {
      env: () => ({}),
      build,
      context: () => new RouterContextProvider(),
      crashPage: "crash",
    });
    expect((await app.fetch(new Request("https://acme.example/"), {}, ctx)).status).toBe(500);
    expect((await app.fetch(new Request("https://acme.example/"), {}, ctx)).status).toBe(200);
    expect(attempts).toBe(2);
    expect(write).toHaveBeenCalledOnce();
    write.mockRestore();
  });
});
