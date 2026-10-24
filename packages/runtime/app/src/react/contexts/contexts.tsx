/**
 * Stackra file contract:
 * Purpose: `Contexts`, the client contexts of the booted app in graph order, outermost first (session, tenancy, query,
 *          realtime, flags, push, platform, theme, i18n, consent, analytics, telemetry, then the UI kit): the keys of
 *          the wiring's `contexts` section, or, without one, the module keys of the graph that have a registered
 *          context. The web root, the router root and the native root mount it with the request's locale and
 *          catalogues.
 * Boundary: reads the wiring from the container of the nearest `ContainerProvider` (`AppWiring`); each component comes
 *           from `registerContext`. A key the wiring or the `contexts` prop names with no registered component throws,
 *           so a missing package entry is a render failure, never a silently absent context.
 * Runtime: isomorphic
 * Governing contract: ADR 0295 (decision 10); ADR 0263 (decision 11); ADR 0294 (decision 23).
 */
import { useContainer } from "@stackra/container/react";
import { createElement } from "react";
import type { ReactNode } from "react";

import { AppWiring } from "#core/services/app-wiring.service";
import { CONTEXT_REGISTRY } from "#react/contexts/context-registry.constant";
import type { ContextProps } from "#react/contexts/context-props.type";
import type { ContextsProps } from "#react/contexts/contexts-props.type";

/**
 * Mounts the app's contexts around `children`.
 *
 * @throws Error outside a `ContainerProvider` whose container `createApp` booted, or for a named key with no
 *         registered context.
 * @example
 * <Contexts locale={loaderData.locale} messages={loaderData.messages}>
 *   <Outlet />
 * </Contexts>
 */
export function Contexts({ contexts, children, ...props }: ContextsProps): ReactNode {
  const { wiring } = useContainer().get(AppWiring);
  const named = contexts ?? wiring.contexts;
  const keys =
    named ?? Object.keys(wiring.modules ?? {}).filter((key) => CONTEXT_REGISTRY.has(key));
  // Innermost first, so the first key ends up outermost; registered components are module-level, never per render.
  return keys.reduceRight<ReactNode>((tree, key) => {
    const context = CONTEXT_REGISTRY.get(key);
    if (context === undefined)
      throw new Error(
        `No context is registered for "${key}": load the react or native entry of the package that owns it (registerContext)`,
      );
    const contextProps: ContextProps = { ...props, children: tree };
    return createElement(context, { key, ...contextProps });
  }, children);
}
