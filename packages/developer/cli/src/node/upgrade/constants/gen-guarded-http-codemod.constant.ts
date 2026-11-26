/**
 * Stackra file contract:
 * Purpose: `GEN_GUARDED_HTTP_CODEMOD`, 0.23.0: every generated endpoint is a guarded Encore raw endpoint and
 *          `auth.ts` goes.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0199 (decision 2); ADR 0013 (decision 5); STA-145; changeset c26fb86.
 */
import type { UpgradeCodemod } from "#node/upgrade/types/upgrade-codemod.type";

/** Every generated endpoint is a guarded Encore raw endpoint. */
export const GEN_GUARDED_HTTP_CODEMOD: UpgradeCodemod = {
  id: "gen-guarded-http",
  version: "0.23.0",
  title: "Every generated endpoint is a guarded Encore raw endpoint",
  note: "Gen writes api.raw() endpoints that run the request guards and CallAuthenticator, binds app.http (maxBodyBytes, 1 MiB by default), and no longer writes auth.ts or the Gateway: delete any code that imported them. Search, report and replica queries and hand-written Controllers now get routes behind the same guards; a Controller answers with no Authorization header, so check its own access rules. stackra gen regenerates the adapters.",
  source: "c26fb86, STA-2577",
};
