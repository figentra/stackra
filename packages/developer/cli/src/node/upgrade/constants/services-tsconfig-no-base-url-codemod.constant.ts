/**
 * Stackra file contract:
 * Purpose: `SERVICES_TSCONFIG_NO_BASE_URL_CODEMOD`, 0.33.0: a service's tsconfig no longer carries `baseUrl`, which
 *          TypeScript 7 removed (TS5102), and `paths` hold each import's first target; the codemod runs
 *          `stackra encore:prepare` in every service, which deletes the `baseUrl` and rewrites the `paths`.
 * Boundary: data only; the work is `encore:prepare`'s (`prepareEncoreService`).
 * Runtime: node
 * Governing contract: ADR 0199 (decision 2); ADR 0091 (rule 4 as corrected 2026-11-10); STA-145; changeset 6186329.
 */
import type { UpgradeCodemod } from "#node/upgrade/types/upgrade-codemod.type";

/** No `baseUrl` in a service. */
export const SERVICES_TSCONFIG_NO_BASE_URL_CODEMOD: UpgradeCodemod = {
  id: "services-tsconfig-no-base-url",
  version: "0.33.0",
  title: "A service's tsconfig drops baseUrl; paths resolve from its folder",
  note: "TypeScript 7 removed baseUrl (TS5102), so the 0.30.0 rule broke typecheck in a TypeScript 7 repository. The service check now refuses a baseUrl and wants paths with each package.json imports key and its first target only. stackra encore:prepare deletes the baseUrl and rewrites the paths, and runs in every service here.",
  source: "6186329, ADR 0091",
  steps: [{ command: ["stackra", "encore:prepare"], in: "services" }],
};
