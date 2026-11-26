/**
 * Stackra file contract:
 * Purpose: `GEN_ENCORE_DEV_DECLARED_CODEMOD`, 0.18.0: gen refuses a service that does not declare `encore.dev`.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0199 (decision 2); ADR 0013 (decision 5); STA-145; changeset 79dcafb.
 */
import type { UpgradeCodemod } from "#node/upgrade/types/upgrade-codemod.type";

/** A service must declare encore.dev. */
export const GEN_ENCORE_DEV_DECLARED_CODEMOD: UpgradeCodemod = {
  id: "gen-encore-dev-declared",
  version: "0.18.0",
  title: "A service must declare encore.dev",
  note: "Gen refuses a service whose generated Encore files import encore.dev without the service declaring it (generated_dependency_missing): Encore Cloud installs it from the service's package.json. Add encore.dev to each service's dependencies. From 0.30.0 the value is the literal reference version, which stackra encore:prepare writes.",
  source: "79dcafb",
};
