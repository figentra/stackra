/**
 * Stackra file contract:
 * Purpose: `renderHook(hook, options)`, Testing Library's hook render with the house defaults of `render`: the
 *          `providers` and the `wrapper` composed into one wrapper, and `cleanup` when the test finishes.
 * Boundary: provider-agnostic; no workspace import.
 * Runtime: browser
 * Governing contract: ADR 0269 (decisions 2 and 6).
 */
import { renderHook as renderHookWithLibrary, type RenderHookResult } from "@testing-library/react";

import { composeWrapper } from "#react/render/compose-wrapper.function";
import { trackRender } from "#react/render/track-render.function";
import type { RenderHookOptions } from "#react/render-hook/render-hook-options.type";

/**
 * Renders `hook` in a host component and hands back its latest result.
 *
 * @example
 * const { result } = renderHook(() => useCounter(), { providers: [StoreTestProvider] });
 * act(() => result.current.increment());
 */
export function renderHook<Result, Props>(
  hook: (props: Props) => Result,
  options: RenderHookOptions<Props> = {},
): RenderHookResult<Result, Props> {
  const { providers, wrapper, ...rest } = options;
  const composed = composeWrapper(providers, wrapper);
  trackRender();
  return renderHookWithLibrary(
    hook,
    composed === undefined ? rest : { ...rest, wrapper: composed },
  );
}
