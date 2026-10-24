/**
 * Stackra file contract:
 * Purpose: unit and type tests of `useNonce`: the provider's nonce inside a `NonceProvider`, and `undefined` (no
 *          throw) outside one, as in the browser after hydration, so `<Scripts nonce>` renders no attribute there.
 * Boundary: test only; renders with react-dom/server.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 23).
 */
import { renderToString } from "react-dom/server";

import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { NonceProvider } from "#react/nonce/nonce-provider";
import { useNonce } from "#react/nonce/use-nonce";

/** A script element stamped with the nonce above it, as the document shell writes one. */
function Script() {
  return <script nonce={useNonce()} />;
}

describe("useNonce", () => {
  it("reads the nonce of the nearest provider", () => {
    expect(
      renderToString(
        <NonceProvider value="abc">
          <Script />
        </NonceProvider>,
      ),
    ).toBe('<script nonce="abc"></script>');
  });

  it("is undefined outside a provider and does not throw", () => {
    expect(renderToString(<Script />)).toBe("<script></script>");
  });

  it("returns a string or undefined", () => {
    expectTypeOf(useNonce).returns.toEqualTypeOf<string | undefined>();
  });
});
