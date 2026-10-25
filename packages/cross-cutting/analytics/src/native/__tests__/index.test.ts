/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./native` entry: the template's mobile wiring imports `PosthogAnalyticsDriver`
 *          from `@stackra/analytics/native`; it is exported, nothing else.
 * Boundary: test only. React Native does not load in vitest, so `react-native` is replaced by an empty `AppState`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import * as native from "#native/index";

vi.mock("react-native", () => ({
  AppState: { addEventListener: () => ({ remove: () => undefined }) },
}));

describe("@stackra/analytics/native", () => {
  it("exports exactly the native PostHog driver", () => {
    expect(Object.keys(native)).toEqual(["PosthogAnalyticsDriver"]);
  });
});
