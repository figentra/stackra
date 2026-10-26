/**
 * Stackra file contract:
 * Purpose: `renderHook(hook, options)`, React Native Testing Library's hook render with the house defaults of `render`:
 *          the `providers` and the `wrapper` composed into one wrapper, and `cleanup` when the test finishes.
 *          Asynchronous, as the library's is from version 14.
 * Boundary: provider-agnostic; no workspace import.
 * Runtime: react-native
 * Governing contract: ADR 0269 (decisions 2 and 6).
 */
import {
  renderHook as renderHookWithLibrary,
  type RenderHookResult,
} from "@testing-library/react-native/pure";

import { composeWrapper } from "#native/render/compose-wrapper.function";
import { trackRender } from "#native/render/track-render.function";
import type { RenderHookOptions } from "#native/render-hook/render-hook-options.type";

/**
 * Renders `hook` in a host component and hands back its latest result.
 *
 * @example
 * const { result } = await renderHook(() => useProfile(), { providers: [SessionTestProvider] });
 * await act(() => result.current.switchTo(scopeId));
 */
export async function renderHook<Result, Props>(
  hook: (props: Props) => Result,
  options: RenderHookOptions<Props> = {},
): Promise<RenderHookResult<Result, Props>> {
  const { providers, wrapper, initialProps } = options;
  const composed = composeWrapper(providers, wrapper);
  trackRender();
  return await renderHookWithLibrary(hook, {
    ...(initialProps === undefined ? {} : { initialProps }),
    ...(composed === undefined ? {} : { wrapper: composed }),
  });
}
