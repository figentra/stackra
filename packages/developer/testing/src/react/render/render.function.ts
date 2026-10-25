/**
 * Stackra file contract:
 * Purpose: `render(ui, options)`, Testing Library's render with the house defaults: the `providers` and the `wrapper`
 *          composed into one wrapper, a `userEvent.setup()` session per render, and `cleanup` when the test finishes.
 * Boundary: provider-agnostic: it adds no provider of its own, so it depends on no workspace package; framework
 *           packages (navigation's route helpers, a package's `./testing`) compose theirs through the options.
 * Runtime: browser (vitest, jsdom)
 * Governing contract: ADR 0269 (decisions 2 and 6).
 */
import { render as renderWithLibrary, type RenderResult } from "@testing-library/react";
import type { ReactElement } from "react";

import { composeWrapper } from "#react/render/compose-wrapper.function";
import type { RenderOptions } from "#react/render/render-options.type";
import { trackRender } from "#react/render/track-render.function";

/**
 * Renders `ui` into the document.
 *
 * @example
 * render(<OrderCard order={order} />, { providers: [I18nTestProvider] });
 * await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
 */
export function render(ui: ReactElement, options: RenderOptions = {}): RenderResult {
  const { providers, wrapper, ...rest } = options;
  const composed = composeWrapper(providers, wrapper);
  trackRender();
  return renderWithLibrary(ui, composed === undefined ? rest : { ...rest, wrapper: composed });
}
