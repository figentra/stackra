/**
 * Stackra file contract:
 * Purpose: proves `ConsentBanner` shows while an optional category is undecided, accepts or refuses every optional
 *          category with equal weight, shows "Manage" and the policy link only when given, and hides once decided or
 *          when only required categories are configured.
 * Boundary: unit tier, jsdom. `@stackra/ui/react` is replaced by DOM stand-ins, the translation returns the key, and
 *           the container hands out a real ledger (`fakeConsent`) and configuration.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0298; owner round 3 #29.
 */
// @vitest-environment jsdom
import { buildConfig } from "@stackra/config";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";

import {
  ConsentCategory,
  ConsentConfig,
  ConsentLedger,
  MemoryConsentStoreDriver,
} from "#core/index";
import { ConsentBanner } from "#ui/consent-banner/consent-banner";

/** What the container hands out. */
const held = vi.hoisted(() => ({ bindings: new Map<unknown, unknown>() }));

vi.mock(
  "@stackra/ui/react",
  async () => (await import("#ui/__tests__/ui-stand-ins.fixture")).UI_STAND_INS,
);
vi.mock("@stackra/i18n/react", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock("@stackra/container/react", () => ({
  useContainer: () => ({ get: (token: unknown) => held.bindings.get(token) }),
}));

/** A configuration listing analytics as optional, and the ledger over it. */
function setUp(optional = true): ConsentLedger {
  const config = buildConfig(ConsentConfig, {
    values: {
      categories: [
        {
          category: ConsentCategory.Necessary,
          required: true,
          defaultGranted: true,
          descriptionKey: null,
        },
        ...(optional
          ? [
              {
                category: ConsentCategory.Analytics,
                required: false,
                defaultGranted: false,
                descriptionKey: null,
              },
            ]
          : []),
      ],
    },
  });
  const ledger = new ConsentLedger(config, new MemoryConsentStoreDriver());
  held.bindings = new Map<unknown, unknown>([
    [ConsentConfig, config],
    [ConsentLedger, ledger],
  ]);
  return ledger;
}

afterEach(() => {
  cleanup();
});

describe("ConsentBanner", () => {
  it("asks while a category is undecided and refuses everything optional with one press", () => {
    const ledger = setUp();
    render(<ConsentBanner policyHref="/legal/cookies" onManage={() => undefined} />);
    expect(screen.getByRole("region", { name: "consent::ui.banner.title" })).toBeTruthy();
    expect(screen.getByText("consent::ui.banner.policy").getAttribute("href")).toBe(
      "/legal/cookies",
    );
    act(() => {
      fireEvent.click(screen.getByText("consent::ui.banner.reject_all"));
    });
    expect(ledger.isGranted(ConsentCategory.Analytics)).toBe(false);
    expect(screen.queryByRole("region")).toBeNull();
  });

  it("accepts everything optional with one press", () => {
    const ledger = setUp();
    render(<ConsentBanner />);
    expect(screen.queryByText("consent::ui.banner.manage")).toBeNull();
    expect(screen.queryByText("consent::ui.banner.policy")).toBeNull();
    act(() => {
      fireEvent.click(screen.getByText("consent::ui.banner.accept_all"));
    });
    expect(ledger.isGranted(ConsentCategory.Analytics)).toBe(true);
  });

  it("shows nothing when only required categories are configured", () => {
    setUp(false);
    render(<ConsentBanner />);
    expect(screen.queryByRole("region")).toBeNull();
  });
});
