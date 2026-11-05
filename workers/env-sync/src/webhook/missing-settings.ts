/**
 * Stackra file contract:
 * Purpose: `missingSettings(env)`, the names of the Worker secrets that are unset or unreadable, for `GET /readyz`:
 *          the webhook key, the stackra-bot App id, and the App key when it is not a PEM private key.
 * Boundary: names only, never a value. The routes setting is checked by the caller, which owns its parse.
 * Runtime: worker
 * Governing contract: STA-2133 (the deploy's smoke check reads /readyz, so a secret that did not bind fails the deploy).
 */
import type { EnvSyncEnv } from "#src/interfaces";

import { pkcs8Of } from "./pkcs8-of";

/** The secrets a dispatch needs whose value is unset, blank or (for the key) not a PEM private key. */
export function missingSettings(env: EnvSyncEnv): string[] {
  const missing: string[] = [];
  if ((env.INFISICAL_WEBHOOK_SECRET ?? "") === "") missing.push("INFISICAL_WEBHOOK_SECRET");
  if ((env.STACKRA_BOT_APP_ID ?? "").trim() === "") missing.push("STACKRA_BOT_APP_ID");
  if (pkcs8Of(env.STACKRA_BOT_PRIVATE_KEY ?? "") === undefined)
    missing.push("STACKRA_BOT_PRIVATE_KEY");
  return missing;
}
