/**
 * Stackra file contract:
 * Purpose: `fakeExtensionContext(overrides?)`, the context a unit test hands an extension's `handle` (or a slot owner):
 *          a system caller, the default request facts and a clock frozen at the moment it was made.
 * Boundary: test only; no pipeline and no app. `now()` reads `Date` once at creation, so `freezeClock` pins it.
 * Runtime: node
 * Governing contract: ADR 0269 (testing helpers); ADR 0305 (rule 25: an extension's `handle`).
 */
import type { ExtensionContext } from "#core/index";
import { CALL_DEFAULTS } from "#core/constants/call-defaults.constant";
import { TEST_ACTOR } from "#testing/constants/test-actor.constant";

/**
 * An extension context for a unit test.
 *
 * @example
 * const out = await new TierMultiplierExtension().handle(100, draft, fakeExtensionContext());
 */
export function fakeExtensionContext(overrides: Partial<ExtensionContext> = {}): ExtensionContext {
  const at = new Date();
  return Object.freeze({
    callId: "call_test",
    key: "test.call",
    actor: TEST_ACTOR,
    ...CALL_DEFAULTS,
    abortSignal: new AbortController().signal,
    now: () => new Date(at.getTime()),
    ...overrides,
  });
}
