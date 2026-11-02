/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./native` entry: it exports exactly `ExpoAppleSignInDriver`, `ExpoPasskeysDriver`,
 *          `ExpoSignInBrowserDriver`, `SignIn`, `useAccountDeletionSheet` and `useAppApprovalSheet`.
 * Boundary: test only; the Expo modules and `@stackra/ui/native` are replaced by stand-ins so the barrel loads
 *           under node.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import * as native from "#native/index";

vi.mock("expo-linking", () => ({ createURL: (path: string) => path }));
vi.mock("expo-web-browser", () => ({ openAuthSessionAsync: vi.fn() }));
vi.mock("react-native-passkey", () => ({ Passkey: {} }));
vi.mock("@stackra/ui/native", () => ({
  Alert: () => null,
  Button: () => null,
  Card: () => null,
  Checkbox: () => null,
  Cluster: () => null,
  Link: () => null,
  PasswordField: () => null,
  Separator: () => null,
  SocialSignInButtons: () => null,
  Stack: () => null,
  Text: () => null,
  TextField: () => null,
}));

describe("@stackra/identity/native", () => {
  it("exports exactly the Expo Apple, passkeys and sign-in browser drivers, the approve sheet hook, the account deletion hook and the SignIn block", () => {
    expect(Object.keys(native).sort()).toEqual([
      "ExpoAppleSignInDriver",
      "ExpoPasskeysDriver",
      "ExpoSignInBrowserDriver",
      "SignIn",
      "useAccountDeletionSheet",
      "useAppApprovalSheet",
    ]);
  });
});
