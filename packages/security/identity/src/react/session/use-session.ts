/**
 * Stackra file contract:
 * Purpose: `useSession()`, the hook a page, a layout or the generated navigation reads the session with: the status,
 *          the user when signed in, and `signIn` and `signOut`; it re-renders on every change.
 * Boundary: reads the `SessionService` of the nearest container through `useSyncExternalStore`, and starts it on mount
 *           (once per service), so a server render and the hydration pass stay `loading` and the store is read only
 *           on the client. A failure to read the session leaves it signed out and goes to the container's
 *           `ErrorReporter` when one is bound. Web and native share it. Throws outside a `ContainerProvider` or when
 *           the container does not bind the session, so a missing session is never a silent sign-out.
 * Runtime: isomorphic
 * Governing contract: ADR 0206 (decision 8); ADR 0295 (decision 10: the presence of the config mounts the context);
 *                     ADR 0294 (decision 17); ADR 0232 (decision 8: report once).
 */
import { useContainer } from "@stackra/container/react";
import { ErrorReporter } from "@stackra/errors/contracts";
import { useEffect, useMemo, useSyncExternalStore } from "react";

import { SessionService } from "#core/index";
import type { SessionValue } from "#react/session/session-value.type";

/**
 * Reads the session (status, user, `signIn`, `signOut`) and re-renders on every change.
 *
 * @throws Error outside a `ContainerProvider`, or when the container does not bind `SessionService`.
 * @example
 * const session = useSession();
 * if (session.status !== SessionStatus.SignedIn) throw SessionRequiredError.create();
 * return <Text>{session.user.email}</Text>;
 */
export function useSession(): SessionValue {
  const container = useContainer();
  const service = container.get(SessionService);
  const state = useSyncExternalStore(service.subscribe, service.current, service.current);
  useEffect(() => {
    service.start().catch((error: unknown) => {
      if (container.has(ErrorReporter)) container.get(ErrorReporter).report(error);
    });
  }, [container, service]);
  return useMemo(
    () => ({
      ...state,
      signIn: (options) => service.signIn(options),
      signOut: () => service.signOut(),
    }),
    [service, state],
  );
}
