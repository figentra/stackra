/**
 * Stackra file contract:
 * Purpose: proves `ConsentPreferences` shows one switch per configured category with its label, keeps a required
 *          category locked on, and records a toggled optional category at once.
 * Boundary: unit tier, jsdom; the same stand-ins and real ledger as the banner's test.
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
import { ConsentPreferences } from "#ui/consent-preferences/consent-preferences";

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

afterEach(() => {
  cleanup();
});

describe("ConsentPreferences", () => {
  it("locks the required category on and records an optional one at once", () => {
    const config = buildConfig(ConsentConfig, {
      values: {
        categories: [
          {
            category: ConsentCategory.Necessary,
            required: true,
            defaultGranted: true,
            descriptionKey: null,
          },
          {
            category: ConsentCategory.Analytics,
            required: false,
            defaultGranted: false,
            descriptionKey: null,
          },
        ],
      },
    });
    const ledger = new ConsentLedger(config, new MemoryConsentStoreDriver());
    held.bindings = new Map<unknown, unknown>([
      [ConsentConfig, config],
      [ConsentLedger, ledger],
    ]);
    render(<ConsentPreferences />);
    const necessary = screen.getByRole("switch", {
      name: "consent::enums.consent_category.necessary",
    });
    expect(necessary.getAttribute("aria-checked")).toBe("true");
    expect(necessary.getAttribute("aria-readonly")).toBe("true");
    const analytics = screen.getByRole("switch", {
      name: "consent::enums.consent_category.analytics",
    });
    expect(analytics.getAttribute("aria-checked")).toBe("false");
    act(() => {
      fireEvent.click(analytics);
    });
    expect(ledger.isGranted(ConsentCategory.Analytics)).toBe(true);
  });
});
