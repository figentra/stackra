/**
 * Stackra file contract:
 * Purpose: unit tests of the route session: `loadRouteSession` keeps the `SessionStore`'s user for its container, a
 *          refusal or no bound store means signed out and any other failure rejects; `routeSessionPart` hands routes
 *          that session and the store as `identity`, and null for a container nothing loaded.
 * Boundary: test only; real containers with the store given as an override.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0457 (session and identity on RouteServices).
 */
import { Container } from "@stackra/container";
import { ErrorKind, Refusal } from "@stackra/errors";
import { SessionStore } from "@stackra/identity/contracts";
import type { SessionUser } from "@stackra/identity/contracts";
import { describe, expect, it } from "@stackra/testing";

import { loadRouteSession } from "#core/functions/load-route-session.function";
import { routeSessionPart } from "#core/functions/route-session-part.function";

class SessionRefusedError extends Refusal({ kind: ErrorKind.Unauthenticated }) {}

const rana = {
  userId: "usr_01j9z3k4m5n6p7q8r9s0t1v2w3",
  email: "rana@acme.example",
  displayName: "Rana",
  permissions: [],
  memberships: [],
} as unknown as SessionUser;

/** A store whose `load` answers with `answer`. */
class FakeSessionStore extends SessionStore {
  readonly answer: () => Promise<SessionUser | null>;

  constructor(answer: () => Promise<SessionUser | null>) {
    super();
    this.answer = answer;
  }

  load(): Promise<SessionUser | null> {
    return this.answer();
  }

  async signIn(): Promise<void> {}

  async signOut(): Promise<void> {}

  async accessToken(): Promise<string | undefined> {
    return undefined;
  }
}

/** A container that binds `store` as the `SessionStore`. */
const withStore = (store: SessionStore): Promise<Container> =>
  Container.create([], { overrides: new Map([[SessionStore, store]]) });

const request = new Request("https://shop.example/account");

describe("route session", () => {
  it("gives routes the signed-in user and the store", async () => {
    const store = new FakeSessionStore(() => Promise.resolve(rana));
    const container = await withStore(store);
    await loadRouteSession(container);
    expect(routeSessionPart({ request, container })).toEqual({ session: rana, identity: store });
  });

  it("keeps the session per container, so one request never sees another's", async () => {
    const root = await withStore(new FakeSessionStore(() => Promise.resolve(rana)));
    const first = root.forRequest();
    const second = root.forRequest();
    await loadRouteSession(first);
    expect(routeSessionPart({ request, container: first }).session).toBe(rana);
    expect(routeSessionPart({ request, container: second }).session).toBeNull();
  });

  it("is signed out when the store refuses the session", async () => {
    const container = await withStore(
      new FakeSessionStore(() => Promise.reject(SessionRefusedError.create())),
    );
    await loadRouteSession(container);
    expect(routeSessionPart({ request, container }).session).toBeNull();
  });

  it("rejects when the store fails with anything but a refusal", async () => {
    const container = await withStore(
      new FakeSessionStore(() => Promise.reject(new Error("session endpoint down"))),
    );
    await expect(loadRouteSession(container)).rejects.toThrow("session endpoint down");
  });

  it("is signed out with no identity when the app binds no store", async () => {
    const container = await Container.create([]);
    await loadRouteSession(container);
    expect(routeSessionPart({ request, container })).toEqual({
      session: null,
      identity: undefined,
    });
    expect(routeSessionPart({ request, container: undefined })).toEqual({
      session: null,
      identity: undefined,
    });
  });
});
