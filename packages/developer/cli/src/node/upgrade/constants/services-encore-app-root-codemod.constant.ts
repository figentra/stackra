/**
 * Stackra file contract:
 * Purpose: `SERVICES_ENCORE_APP_ROOT_CODEMOD`, 0.30.0: a service's Encore app root is the member root, which needs
 *          `encore.dev` pinned to the reference version and tsconfig `paths` from package.json `imports`; the codemod
 *          runs `stackra encore:prepare` in every service.
 * Boundary: data only; the work is `encore:prepare`'s (`prepareEncoreService`).
 * Runtime: node
 * Governing contract: ADR 0199 (decision 2); ADR 0091 (decision 2); STA-145; changeset 5b064da.
 */
import type { UpgradeCodemod } from "#node/upgrade/types/upgrade-codemod.type";

/** The Encore app at the member root. */
export const SERVICES_ENCORE_APP_ROOT_CODEMOD: UpgradeCodemod = {
  id: "services-encore-app-root",
  version: "0.30.0",
  title: "A service's Encore app root is the member root",
  note: "Gen writes encore.app at services/<name>/encore.app (gitignore services/*/encore.app) instead of .stackra/encore/. stackra validate --repository holds each service to a literal encore.dev equal to the reference version and to tsconfig paths equal to its package.json imports; stackra encore:prepare writes both, and runs in every service here.",
  source: "5b064da, ADR 0091",
  steps: [{ command: ["stackra", "encore:prepare"], in: "services" }],
};
