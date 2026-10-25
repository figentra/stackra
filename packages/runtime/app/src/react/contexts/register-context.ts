/**
 * Stackra file contract:
 * Purpose: `registerContext`, how a client package names the component `Contexts` mounts for its context key: called
 *          once when the package's `react` or `native` entry loads (`registerContext("theming", ThemeProvider)`).
 * Boundary: registers only. A key registered twice with a different component throws, so two packages can never
 *           silently fight over one key; registering the same component again is a no-op (a module loaded twice).
 * Runtime: isomorphic
 * Governing contract: ADR 0295 (decision 10); ADR 0294 (decision 23: a Provider is a React context component only).
 */
import type { ContextComponent } from "#react/contexts/context-component.type";
import { CONTEXT_REGISTRY } from "#react/contexts/context-registry.constant";

/**
 * Registers `component` as the context of `key`.
 *
 * @throws Error when `key` already has a different component.
 * @example
 * registerContext("theming", ThemeProvider);
 */
export function registerContext(key: string, component: ContextComponent): void {
  const known = CONTEXT_REGISTRY.get(key);
  if (known !== undefined && known !== component)
    throw new Error(
      `The context "${key}" is already registered to ${known.displayName ?? known.name}; one key has one component`,
    );
  CONTEXT_REGISTRY.set(key, component);
}
