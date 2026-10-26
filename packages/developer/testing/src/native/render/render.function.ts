/**
 * Stackra file contract:
 * Purpose: `render(ui, options)`, React Native Testing Library's render with the house defaults: the `providers` and the
 *          `wrapper` composed into one wrapper, a `userEvent.setup()` session per render, and `cleanup` when the test
 *          finishes. Asynchronous, as the library's render is from version 14: `await render(...)`.
 * Boundary: provider-agnostic: it adds no provider of its own, so it depends on no workspace package. Imports the
 *           library's `pure` entry, which installs no global hooks and no jest matchers.
 * Runtime: react-native
 * Governing contract: ADR 0269 (decisions 2 and 6).
 */
import { render as renderWithLibrary, type RenderResult } from "@testing-library/react-native/pure";
import type { ReactElement } from "react";

import { composeWrapper } from "#native/render/compose-wrapper.function";
import type { RenderOptions } from "#native/render/render-options.type";
import { trackRender } from "#native/render/track-render.function";

/**
 * Renders `ui` with the test renderer.
 *
 * @example
 * await render(<OrderCard order={order} />, { providers: [I18nTestProvider] });
 * await userEvent.press(screen.getByRole("button", { name: "Cancel" }));
 */
export async function render(ui: ReactElement, options: RenderOptions = {}): Promise<RenderResult> {
  const wrapper = composeWrapper(options.providers, options.wrapper);
  trackRender();
  return await renderWithLibrary(ui, wrapper === undefined ? {} : { wrapper });
}
