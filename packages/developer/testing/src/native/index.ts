/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./native` entry of @stackra/testing (thin wrappers over React Native Testing Library:
 *          `render`, `renderHook`, `userEvent` with the house defaults, the library's own `screen` and `act`, and the
 *          `axe` accessibility check with its `toHaveNoViolations` matcher) until `stackra gen` writes the entry
 *          barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Provider-agnostic and free of workspace imports (ADR 0269
 *           decision 2). Importing it registers `toHaveNoViolations`. The native `renderRoute` needs navigation, so it
 *           does not live here.
 * Runtime: react-native (vitest)
 * Governing contract: ADR 0294 (decision 15); ADR 0269 (decisions 2 and 6); the STA-347 stand-in barrel decision.
 */
export { act, screen } from "@testing-library/react-native/pure";
export { axe } from "#native/axe/axe.function";
export type { AxeNode } from "#native/axe/axe-node.type";
export type { AxeResult } from "#native/axe/axe-result.type";
export { toHaveNoViolations } from "#native/axe/to-have-no-violations.matcher";
export { render } from "#native/render/render.function";
export type { RenderOptions } from "#native/render/render-options.type";
export { renderHook } from "#native/render-hook/render-hook.function";
export type { RenderHookOptions } from "#native/render-hook/render-hook-options.type";
export { userEvent } from "#native/user-event/user-event.constant";
