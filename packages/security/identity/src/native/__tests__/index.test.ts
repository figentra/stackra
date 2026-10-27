/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./native` entry: it exports exactly `ExpoSignInBrowserDriver` and
 *          `useAppApprovalSheet`.
 * Boundary: test only; the Expo modules are replaced by stand-ins so the barrel loads under node.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import * as native from "#native/index";

vi.mock("expo-linking", () => ({ createURL: (path: string) => path }));
vi.mock("expo-web-browser", () => ({ openAuthSessionAsync: vi.fn() }));

describe("@stackra/identity/native", () => {
  it("exports exactly the Expo sign-in browser and the approve sheet hook", () => {
    expect(Object.keys(native).sort()).toEqual(["ExpoSignInBrowserDriver", "useAppApprovalSheet"]);
  });
});
