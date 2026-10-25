// @vitest-environment jsdom
/**
 * Stackra file contract:
 * Purpose: unit and type tests of `useSession`: it starts the session on mount and re-renders on every change, its
 *          status narrows `user`, `signIn` and `signOut` go through the session, a server render stays `loading`, a
 *          read failure goes to the bound `ErrorReporter`, and it throws outside a provider or when nothing binds the
 *          session.
 * Boundary: test only; client renders through Testing Library (jsdom), the server render through react-dom/server.
 * Runtime: browser (vitest, jsdom)
 * Governing contract: ADR 0022; ADR 0269; ADR 0206 (decision 8); ADR 0295 (decision 10).
 */
import { buildConfig } from "@stackra/config";
import { Container, Driver } from "@stackra/container";
import type { Token } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { ErrorReporter } from "@stackra/errors/contracts";
import { PermissionSnapshotService } from "@stackra/iam";
import { ActiveScopeService } from "@stackra/scope";
import { TenantSwitcher } from "@stackra/tenancy";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { renderToString } from "react-dom/server";

import { IdentityConfig } from "#config/identity.config";
import type { SessionUser } from "#contracts/index";
import { MemorySessionStoreDriver, SessionService, SessionStatus } from "#core/index";
import type { SessionValue } from "#react/session/session-value.type";
import { useSession } from "#react/session/use-session";

/** The account. */
const USER: SessionUser = {
  userId: "usr_01j9z3k4m5n6p7q8r9s0t1v2w3",
  email: "rana@acme.example",
  displayName: "Rana",
  permissions: [],
  tenants: [],
};

/** A reporter that keeps what it was given. */
class KeptErrorReporterDriver extends Driver(ErrorReporter) {
  readonly errors: unknown[] = [];

  report(error: unknown): void {
    this.errors.push(error);
  }
}

/** A session over a memory store of `USER`. */
function sessionOf(signedIn: boolean): SessionService {
  return new SessionService(
    buildConfig(IdentityConfig),
    new MemorySessionStoreDriver(USER, signedIn),
    new TenantSwitcher(new ActiveScopeService()),
    new PermissionSnapshotService(),
  );
}

/** A wrapper whose container binds `session` and, when given, `reporter`. */
async function wrapperFor(session: SessionService, reporter?: ErrorReporter) {
  const overrides = new Map<Token, object>([[SessionService, session]]);
  if (reporter !== undefined) overrides.set(ErrorReporter, reporter);
  const container = await Container.create([], { overrides });
  return ({ children }: { children: ReactNode }) => (
    <ContainerProvider container={container}>{children}</ContainerProvider>
  );
}

/** The address of a signed-in session; checking `status` narrows `user`. */
function emailOf(session: SessionValue) {
  return session.status === SessionStatus.SignedIn ? session.user.email : session.user;
}

/** Renders the status, as the generated navigation reads it. */
function Status() {
  const session = useSession();
  return <span>{session.status}</span>;
}

describe("useSession", () => {
  it("types the value as a union on status", () => {
    expectTypeOf(useSession).returns.toEqualTypeOf<SessionValue>();
    expectTypeOf(emailOf).returns.toEqualTypeOf<`${string}@${string}` | null>();
  });

  it("starts the session on mount and re-renders signed in", async () => {
    const { result } = renderHook(() => useSession(), {
      wrapper: await wrapperFor(sessionOf(true)),
    });
    await waitFor(() => expect(result.current.status).toBe(SessionStatus.SignedIn));
    expect(result.current.user).toBe(USER);
  });

  it("signs in and out through the session", async () => {
    const { result } = renderHook(() => useSession(), {
      wrapper: await wrapperFor(sessionOf(false)),
    });
    await waitFor(() => expect(result.current.status).toBe(SessionStatus.SignedOut));
    await act(() => result.current.signIn());
    expect(result.current.status).toBe(SessionStatus.SignedIn);
    await act(() => result.current.signOut());
    expect(result.current.status).toBe(SessionStatus.SignedOut);
    expect(result.current.user).toBeNull();
  });

  it("stays loading in a server render", async () => {
    const Wrapper = await wrapperFor(sessionOf(true));
    expect(
      renderToString(
        <Wrapper>
          <Status />
        </Wrapper>,
      ),
    ).toBe("<span>loading</span>");
  });

  it("reports a failure to read the session and shows signed out", async () => {
    const failure = new TypeError("network down");
    const store = new MemorySessionStoreDriver();
    store.load = () => Promise.reject(failure);
    const session = new SessionService(
      buildConfig(IdentityConfig),
      store,
      new TenantSwitcher(new ActiveScopeService()),
      new PermissionSnapshotService(),
    );
    const reporter = new KeptErrorReporterDriver();
    const { result } = renderHook(() => useSession(), {
      wrapper: await wrapperFor(session, reporter),
    });
    await waitFor(() => expect(reporter.errors).toEqual([failure]));
    expect(result.current.status).toBe(SessionStatus.SignedOut);
  });

  it("throws outside a ContainerProvider", () => {
    expect(() => renderToString(<Status />)).toThrow(/ContainerProvider/);
  });

  it("throws when the container does not bind SessionService", async () => {
    const container = await Container.create([]);
    expect(() =>
      renderToString(
        <ContainerProvider container={container}>
          <Status />
        </ContainerProvider>,
      ),
    ).toThrow(/SessionService/);
  });
});
