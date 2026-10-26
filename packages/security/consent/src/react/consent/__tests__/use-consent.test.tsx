/**
 * Stackra file contract:
 * Purpose: unit and type tests of `useConsent`: the category form gives the banner's `isLoaded`, `status`, `grant`,
 *          `deny` and `reset`; the bare form gives every category's status and writer; both re-render on a change,
 *          show no decision state in a server render, read the `ConsentLedger` the nearest container binds, and throw
 *          outside a provider or when nothing binds the ledger.
 * Boundary: test only; client renders through Testing Library (jsdom), the server render through react-dom/server.
 * Runtime: browser (vitest, jsdom)
 * Governing contract: ADR 0022; ADR 0269; ADR 0298 (decisions 1 to 3 and 6); ADR 0295 (decision 10).
 */
// @vitest-environment jsdom
import { Container } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { renderToString } from "react-dom/server";

import { ConsentCategory, ConsentLedger, ConsentStatus } from "#core/index";
import type { CategoryConsent } from "#react/consent/category-consent.type";
import type { ConsentState } from "#react/consent/consent-state.type";
import { useConsent } from "#react/consent/use-consent";
import { fakeConsent } from "#testing/functions/fake-consent.function";

/** A wrapper whose container binds `ledger` as the `ConsentLedger`. */
async function wrapperFor(ledger: ConsentLedger) {
  const container = await Container.create([], { overrides: new Map([[ConsentLedger, ledger]]) });
  return ({ children }: { children: ReactNode }) => (
    <ContainerProvider container={container}>{children}</ContainerProvider>
  );
}

/** Renders the analytics status, as the banner reads it. */
function AnalyticsStatus() {
  const consent = useConsent(ConsentCategory.Analytics);
  return <span>{`${String(consent.isLoaded)}:${consent.status}`}</span>;
}

/** Renders whether necessary and analytics are granted, as the settings switches read them. */
function Switches() {
  const consent = useConsent();
  const necessary = String(consent.isGranted(ConsentCategory.Necessary));
  const analytics = String(consent.isGranted(ConsentCategory.Analytics));
  return <span>{`${necessary}:${analytics}`}</span>;
}

describe("useConsent", () => {
  it("types its two forms", () => {
    expectTypeOf(useConsent).toBeCallableWith(ConsentCategory.Analytics);
    expectTypeOf(useConsent).toBeCallableWith();
    const forCategory: (category: ConsentCategory) => CategoryConsent = useConsent;
    const forAll: () => ConsentState = useConsent;
    expect(forCategory).toBe(forAll);
  });

  describe("for one category", () => {
    it("reads the decision once loaded, and grants, denies and resets it", async () => {
      const ledger = fakeConsent();
      const { result } = renderHook(() => useConsent(ConsentCategory.Analytics), {
        wrapper: await wrapperFor(ledger),
      });
      expect(result.current.isLoaded).toBe(true);
      expect(result.current.status).toBe(ConsentStatus.Undecided);
      act(() => result.current.grant());
      expect(result.current.status).toBe(ConsentStatus.Granted);
      expect(ledger.isGranted(ConsentCategory.Analytics)).toBe(true);
      act(() => result.current.deny());
      expect(result.current.status).toBe(ConsentStatus.Denied);
      act(() => result.current.reset());
      expect(result.current.status).toBe(ConsentStatus.Undecided);
    });

    it("re-renders when the ledger changes elsewhere", async () => {
      const ledger = fakeConsent();
      const { result } = renderHook(() => useConsent(ConsentCategory.Analytics), {
        wrapper: await wrapperFor(ledger),
      });
      act(() => ledger.set(ConsentCategory.Analytics, true));
      expect(result.current.status).toBe(ConsentStatus.Granted);
    });

    it("shows no decision state in a server render", async () => {
      const ledger = fakeConsent((fake) => fake.set(ConsentCategory.Analytics, true));
      const Wrapper = await wrapperFor(ledger);
      expect(
        renderToString(
          <Wrapper>
            <AnalyticsStatus />
          </Wrapper>,
        ),
      ).toBe("<span>false:undecided</span>");
    });
  });

  describe("for every category", () => {
    it("reads and writes each category; the required one stays granted", async () => {
      const ledger = fakeConsent();
      const { result } = renderHook(() => useConsent(), { wrapper: await wrapperFor(ledger) });
      expect(result.current.isLoaded).toBe(true);
      expect(result.current.isGranted(ConsentCategory.Necessary)).toBe(true);
      expect(result.current.isGranted(ConsentCategory.Analytics)).toBe(false);
      act(() => result.current.set(ConsentCategory.Analytics, true));
      expect(result.current.isGranted(ConsentCategory.Analytics)).toBe(true);
      expect(result.current.isGranted(ConsentCategory.CrashReplay)).toBe(false);
      act(() => result.current.set(ConsentCategory.Necessary, false));
      expect(result.current.status(ConsentCategory.Necessary)).toBe(ConsentStatus.Granted);
      act(() => result.current.reset());
      expect(result.current.status(ConsentCategory.Analytics)).toBe(ConsentStatus.Undecided);
    });

    it("shows only the required category granted in a server render", async () => {
      const ledger = fakeConsent((fake) => fake.set(ConsentCategory.Analytics, true));
      const Wrapper = await wrapperFor(ledger);
      expect(
        renderToString(
          <Wrapper>
            <Switches />
          </Wrapper>,
        ),
      ).toBe("<span>true:false</span>");
    });
  });

  it("throws outside a ContainerProvider", () => {
    expect(() => renderToString(<AnalyticsStatus />)).toThrow(/ContainerProvider/);
  });

  it("throws when the container does not bind ConsentLedger", async () => {
    const container = await Container.create([]);
    expect(() =>
      renderToString(
        <ContainerProvider container={container}>
          <AnalyticsStatus />
        </ContainerProvider>,
      ),
    ).toThrow(/ConsentLedger/);
  });
});
