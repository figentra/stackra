/**
 * Stackra file contract:
 * Purpose: unit tests of `BffSessionStoreDriver`: the session is read from `<origin><bff>/session` with the cookie, a
 *          401 or a `null` answer is signed out, a failure or a body that is not a session is a `TransportError`, the
 *          login URL carries `returnTo`, sign-in leaves for it, sign-out posts to `/logout`, every call carries the
 *          `x-stackra-csrf` header (STA-1385), and no token is ever sent.
 * Boundary: test only; `fetch` and `location` are stubbed, so nothing reaches a network or navigates.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0206 (decision 8); ADR 0241 (decision 2).
 */
import { ClientsConfig, TransportError } from "@stackra/clients";
import { buildConfig } from "@stackra/config";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { IdentityConfig } from "#config/identity.config";
import { BffSessionStoreDriver } from "#core/drivers/bff-session-store.driver";

/** A user as the BFF answers it. */
const USER = {
  userId: "usr_01j9z3k4m5n6p7q8r9s0t1v2w3",
  email: "rana@acme.example",
  displayName: "Rana",
  permissions: ["orders.order.read"],
  memberships: [],
};

/** Stubs `fetch` to answer `body` with `status` and returns the requests it saw. */
function stubFetch(body: unknown, status = 200): Request[] {
  const seen: Request[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn((request: Request) => {
      seen.push(request);
      return Promise.resolve(
        body === undefined ? new Response(null, { status }) : Response.json(body, { status }),
      );
    }),
  );
  return seen;
}

/** A driver on the API origin `https://api.acme.example`. */
function driver(): BffSessionStoreDriver {
  return new BffSessionStoreDriver(
    buildConfig(IdentityConfig),
    buildConfig(ClientsConfig, { values: { baseUrl: "https://api.acme.example/" } }),
  );
}

describe("BffSessionStoreDriver", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reads the user from the session endpoint with the cookie", async () => {
    const seen = stubFetch({ user: USER });
    expect(await driver().load()).toEqual(USER);
    expect(seen[0]?.url).toBe("https://api.acme.example/api/auth/session");
    expect(seen[0]?.method).toBe("GET");
    expect(seen[0]?.credentials).toBe("include");
    expect(seen[0]?.headers.get("x-stackra-csrf")).toBe("1");
    expect(seen[0]?.headers.has("Authorization")).toBe(false);
  });

  it("is signed out on a 401 and on a null answer", async () => {
    stubFetch(undefined, 401);
    expect(await driver().load()).toBeNull();
    stubFetch(null);
    expect(await driver().load()).toBeNull();
  });

  it("refuses a failing BFF and an answer that is not a session", async () => {
    stubFetch(undefined, 502);
    await expect(driver().load()).rejects.toBeInstanceOf(TransportError);
    stubFetch({ user: { ...USER, userId: "42" } });
    await expect(driver().load()).rejects.toBeInstanceOf(TransportError);
  });

  it("builds the login URL with returnTo", () => {
    expect(driver().loginUrl("/settings?tab=device")).toBe(
      "https://api.acme.example/api/auth/login?returnTo=%2Fsettings%3Ftab%3Ddevice",
    );
  });

  it("adds a provider hint and a step-up to the login URL", () => {
    const url = new URL(
      driver().loginUrl("/", {
        scopes: ["urn:zitadel:iam:org:idp:id:42"],
        forceLogin: true,
        maxAge: 0,
        acrValues: ["mfa"],
      }),
    );
    expect(url.searchParams.get("scope")).toBe("urn:zitadel:iam:org:idp:id:42");
    expect(url.searchParams.get("prompt")).toBe("login");
    expect(url.searchParams.get("max_age")).toBe("0");
    expect(url.searchParams.get("acr_values")).toBe("mfa");
  });

  it("leaves for the login and comes back to the current path", async () => {
    const assign = vi.fn();
    vi.stubGlobal("location", { pathname: "/orders", search: "?page=2", hash: "#top", assign });
    void driver().signIn();
    await Promise.resolve();
    expect(assign).toHaveBeenCalledWith(
      "https://api.acme.example/api/auth/login?returnTo=%2Forders%3Fpage%3D2%23top",
    );
  });

  it("posts the sign-out, and an ended session is no failure", async () => {
    const seen = stubFetch(undefined, 204);
    await driver().signOut();
    expect(seen[0]?.url).toBe("https://api.acme.example/api/auth/logout");
    expect(seen[0]?.method).toBe("POST");
    expect(seen[0]?.headers.get("x-stackra-csrf")).toBe("1");
    stubFetch(undefined, 401);
    await expect(driver().signOut()).resolves.toBeUndefined();
    stubFetch(undefined, 500);
    await expect(driver().signOut()).rejects.toBeInstanceOf(TransportError);
  });

  it("sends no token", async () => {
    expect(await driver().accessToken()).toBeUndefined();
  });
});
