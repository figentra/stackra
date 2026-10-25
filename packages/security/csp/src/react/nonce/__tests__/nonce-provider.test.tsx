/**
 * Stackra file contract:
 * Purpose: unit tests of `NonceProvider`: it renders its children and makes its nonce the one `useNonce()` reads
 *          below it, the nearest provider winning, on a server render.
 * Boundary: test only; renders with react-dom/server, so no DOM environment is needed.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 23).
 */
import { renderToString } from "react-dom/server";

import { describe, expect, it } from "@stackra/testing";

import { NonceProvider } from "#react/nonce/nonce-provider";
import { useNonce } from "#react/nonce/use-nonce";

/** Prints the nonce above it. */
function Probe() {
  return <span>{useNonce()}</span>;
}

describe("NonceProvider", () => {
  it("renders its children under its nonce", () => {
    expect(
      renderToString(
        <NonceProvider value="abc">
          <Probe />
        </NonceProvider>,
      ),
    ).toBe("<span>abc</span>");
  });

  it("lets the nearest provider win", () => {
    expect(
      renderToString(
        <NonceProvider value="outer">
          <Probe />
          <NonceProvider value="inner">
            <Probe />
          </NonceProvider>
        </NonceProvider>,
      ),
    ).toBe("<span>outer</span><span>inner</span>");
  });
});
