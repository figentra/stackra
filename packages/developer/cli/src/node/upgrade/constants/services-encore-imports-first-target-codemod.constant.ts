/**
 * Stackra file contract:
 * Purpose: `SERVICES_ENCORE_IMPORTS_FIRST_TARGET_CODEMOD`, 0.33.1: a service's tsconfig `paths` keep each import's
 *          first target; the codemod runs `stackra encore:prepare`.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0199 (decision 2); ADR 0013 (decision 5); STA-145; changeset d60f9d5.
 */
import type { UpgradeCodemod } from "#node/upgrade/types/upgrade-codemod.type";

/** A service's tsconfig paths carry the first target of each import only. */
export const SERVICES_ENCORE_IMPORTS_FIRST_TARGET_CODEMOD: UpgradeCodemod = {
  id: "services-encore-imports-first-target",
  version: "0.33.1",
  title: "A service's tsconfig paths carry the first target of each import only",
  note: "Encore honours only the first ./ target of a tsconfig paths key, so stackra encore:prepare writes, and stackra validate --repository expects, each package.json imports key with its first target only; gen writes .stackra/tsconfig.typecheck.json, which stackra typecheck uses in a service. The codemod runs stackra encore:prepare in every service; stackra gen runs last.",
  source: "d60f9d5, ADR 0091",
  steps: [{ command: ["stackra", "encore:prepare"], in: "services" }],
};
