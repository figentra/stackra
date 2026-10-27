#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: the repository-shape gate run by `pnpm validate` (part of `pnpm verify`): a thin wrapper over
 *          @stackra/repo-checks, which holds every check this script used to carry (catalog versions, names by
 *          placement, tier tags, presets, required files, forbidden dependencies, service shape, test placement,
 *          JSON vs JSONC, runway schemas and files, YAML flow maps, imports, the Expo form factor, window sizing and the
 *          lang catalogues). `stackra check --only config,structure,catalogues` runs the same checks. Also runs the
 *          package-cycle check (`package-cycles.mjs`) and the architecture map drift check (apps/docs
 *          `scripts/architecture-map`), STA-1373.
 *          Prints the findings as `<dir>: <finding>` and exits 1; prints nothing on success.
 * Boundary: a thin wrapper; the checks themselves are @stackra/repo-checks'.
 * Runtime: node
 * Governing contract: ADR 0129 (house lint plugin and coding standard); ADR 0022 (tests live in tests folders).
 * Scope: every member listed by `pnpm -r list --json --depth -1`; test placement covers every non-ignored file.
 * Owner: release-operations · Secrets: forbidden
 */
import { fileURLToPath } from "node:url";

import { architectureMapFindings } from "../../apps/docs/scripts/architecture-map/architecture-map.mjs";
import { packageCycleFindings } from "./package-cycles.mjs";
import { checks } from "./repo-checks.mjs";

export const {
  FORBIDDEN_DEPENDENCIES,
  PRO_DEPENDENCIES,
  MUST_STAY_JSON,
  MUST_STAY_JSONC,
  RUNWAY_SCHEMA_KINDS,
  tierFor,
  expectedName,
  checkMember: check,
  checkMemberFiles: checkFiles,
  checkMemberMetadata,
  checkExports,
  isV2Service,
  checkService,
  checkJsonConfigs,
  checkRunwaySchemas,
  runwayKindOf,
  checkRunwayFiles,
  isRunwayFile,
  isRepoOwnedYaml,
  checkYamlFlowMaps,
  checkTestPlacement,
  isMemberSource,
  checkImports,
  isExpoAppConfig,
  checkIosFormFactor,
  checkWindowSizing,
} = checks;

const ROOT = fileURLToPath(new URL("../../", import.meta.url));

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const context = checks.readRepoContext(ROOT);
  const findings = [
    ...checks.configFindings(context),
    ...checks.catalogueFindings(context),
    ...(await checks.structureFindings(context, {
      ci: Boolean(process.env.CI),
      warn: (text) => console.warn(text),
    })),
    ...packageCycleFindings(ROOT),
    ...architectureMapFindings(ROOT),
  ];
  for (const { dir, text } of findings) console.error(`${dir || "."}: ${text}`);
  if (findings.length) {
    console.error(`\n${findings.length} finding(s).`);
    process.exit(1);
  }
}
