/**
 * Stackra file contract:
 * Purpose: `signInMethodsOf`, the built-in sign-in methods a market offers on a date (password, passkey, phone code,
 *          email code, app approval), read from the market pack under `IdentityConfig.signInMethodsKey`, without the
 *          ones the scope switched off.
 * Boundary: pure; which methods a market offers is pack data and which a scope switched off is that scope's setting
 *           value, passed in, so no method is hard-wired on. A pack value that is not a list counts as none, and an
 *           unknown key is dropped.
 * Runtime: isomorphic
 * Governing contract: STA-1304 (owner request 2026-10-27); owner round 3 #21; ADR 0370; ADR 0363.
 */
import { Enum } from "@stackra/contracts";
import { type ResolvedPack, valueOf } from "@stackra/market-packs";

import type { IdentityConfig } from "#config/identity.config";
import { SignInMethod } from "#core/enums/sign-in-method.enum";

/** The method codes. */
const METHODS: readonly string[] = Enum.values(SignInMethod);

/**
 * The method keys `resolved` offers on `on`, in the pack's order, less `off`.
 *
 * @example
 * signInMethodsOf(await packs.resolve("sa"), today, identity, scopeSettings.signInMethodsOff); // ["passkey", "app_approval"]
 */
export function signInMethodsOf(
  resolved: ResolvedPack,
  on: string,
  config: Pick<IdentityConfig, "signInMethodsKey">,
  off: readonly string[] = [],
): readonly SignInMethod[] {
  const listed = valueOf(resolved, config.signInMethodsKey, on)?.value;
  if (!Array.isArray(listed)) return [];
  return listed.filter(
    (key): key is SignInMethod =>
      typeof key === "string" && METHODS.includes(key) && !off.includes(key),
  );
}
