/**
 * Stackra file contract:
 * Purpose: `useColorScheme()`, the hook a toggle, a header or a settings page reads the colour scheme with: the chosen
 *          scheme, the scheme on screen and the setter, re-rendering when either changes.
 * Boundary: reads the `ColorSchemeService` of the nearest container through `useSyncExternalStore`. A server render
 *           and a hydrating client both read the service's initial state (the default scheme, `system` shown as
 *           light), so hydration never mismatches; the device's choice follows right after. Touches no platform API,
 *           so the same hook serves the web and native runtimes. Throws outside a `ContainerProvider` or when the
 *           container does not bind the service.
 * Runtime: isomorphic
 * Governing contract: ADR 0060 (light and dark); ADR 0079 (client state); ADR 0294 (decision 17); ADR 0295 (decision
 *                     10).
 */
import { useContainer } from "@stackra/container/react";
import { useSyncExternalStore } from "react";

import { ColorSchemeService } from "#core/index";
import type { ColorSchemeState } from "#core/index";

/**
 * The colour scheme and its setter.
 *
 * @throws Error outside a `ContainerProvider`, or when the container does not bind `ColorSchemeService`.
 * @example
 * const scheme = useColorScheme();
 * const isDark = scheme.resolved === ColorScheme.Dark;
 * scheme.setScheme(isDark ? ColorScheme.Light : ColorScheme.Dark);
 */
export function useColorScheme(): ColorSchemeState {
  const service = useContainer().get(ColorSchemeService);
  return useSyncExternalStore(service.subscribe, service.state, service.initialState);
}
