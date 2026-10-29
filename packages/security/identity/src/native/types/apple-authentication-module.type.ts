/**
 * Stackra file contract:
 * Purpose: `AppleAuthenticationModule`, the part of `expo-apple-authentication` that `ExpoAppleSignInDriver` calls:
 *          availability, the sign-in sheet and the scope codes.
 * Boundary: a type only, written here because the library is not a dependency of this package (not in the catalog,
 *           STA-1578); it mirrors the library's own declarations for these three members.
 * Runtime: react-native
 * Governing contract: ADR 0206 (decision 8); STA-1578.
 */

/** The library members the driver uses. */
export type AppleAuthenticationModule = {
  readonly isAvailableAsync: () => Promise<boolean>;
  readonly signInAsync: (options: { requestedScopes: number[]; nonce: string }) => Promise<{
    user: string;
    identityToken: string | null;
    authorizationCode: string | null;
    email: string | null;
    fullName: { givenName: string | null; familyName: string | null } | null;
  }>;
  readonly AppleAuthenticationScope: { readonly FULL_NAME: number; readonly EMAIL: number };
};
