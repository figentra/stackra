/**
 * Stackra file contract:
 * Purpose: `ContainerProvider`, the React context component that puts the booted container under a tree, so a
 *          package's hook (`useConfig`, a renderer) resolves its classes from it on the server and in the browser.
 * Boundary: provides the container and renders its children; it builds nothing. Mounted by the generated entries
 *           (`entry.server.tsx`, `createApp`), never by hand in app code.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 23: a Provider is a React context component only); ADR 0295 (decision 10).
 */
import type { ReactNode } from "react";

import { ContainerContext } from "./container-context";
import type { ContainerProviderProps } from "./container-provider-props.type";

/**
 * Makes `container` the container of everything under it.
 *
 * @example
 * <ContainerProvider container={context.get(containerContext)}>
 *   <ServerRouter context={routerContext} url={request.url} />
 * </ContainerProvider>
 */
export function ContainerProvider({ container, children }: ContainerProviderProps): ReactNode {
  return <ContainerContext value={container}>{children}</ContainerContext>;
}
