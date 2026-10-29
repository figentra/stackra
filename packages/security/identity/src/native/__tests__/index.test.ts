/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./native` entry: it exports exactly `ExpoPasskeysDriver`,
 *          `ExpoSignInBrowserDriver` and `useAppApprovalSheet`.
 * Boundary: test only; the Expo modules are replaced by stand-ins so the barrel loads under node.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import * as native from "#native/index";

vi.mock("expo-linking", () => ({ createURL: (path: string) => path }));
vi.mock("expo-web-browser", () => ({ openAuthSessionAsync: vi.fn() }));
vi.mock("react-native-passkey", () => ({ Passkey: {} }));

describe("@stackra/identity/native", () => {
  it("exports exactly the Expo passkeys and sign-in browser drivers, the approve sheet hook and the account deletion hook", () => {
    expect(Object.keys(native).sort()).toEqual([
      "ExpoPasskeysDriver",
      "ExpoSignInBrowserDriver",
      "useAccountDeletionSheet",
      "useAppApprovalSheet",
    ]);
  });
});
