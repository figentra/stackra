/**
 * Stackra file contract:
 * Purpose: `structureFindings(context, options)`, the `structure` phase of `stackra check` (what `pnpm validate` ran
 *          as validate-repository.mjs, minus the config and catalogue checks): test placement and forbidden files,
 *          the runway schemas and files, member imports, raw SQL reasons, the Expo form factor and window sizing, the
 *          native module packages (ADR 0478), row-security tests in the integration tier (ADR 0239), the brand NOTICE, public id prefixes across apps and services, and
 *          per member its manifest, required files and service shape, a notice listing every anonymous-callable call
 *          not in REVIEWED_ANONYMOUS_SURFACES (STA-2025), and in the Stackra repository its npm and
 *          `stackra` metadata.
 * Boundary: reads the listed files and runs `pnpm -r list`; returns findings and never prints. The runway check loads
 *           the built `@stackra/runway` (local member first, then the installed package); unbuilt is a finding when
 *           `options.ci` and the member is local, otherwise a notice through `options.warn`.
 * Runtime: node
 * Governing contract: ADR 0022; ADR 0025; ADR 0090; ADR 0124; ADR 0177; ADR 0195; ADR 0233; ADR 0296; STA-461;
 *                     ADR 0024 (decision 2: the brand NOTICE); ADR 0453 (decision 11, amendment of 2026-10-27); ADR 0478;
 *                     ADR 0160 (decision 1: the `raw-sql` reason, stackra-288); ADR 0135 (public id prefixes);
 *                     ADR 0239 (decision 1: row-security tests run on Postgres).
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { REVIEWED_ANONYMOUS_SURFACES } from "#node/constants/reviewed-anonymous-surfaces.constant";
import { RAW_SQL_BASELINE } from "#node/constants/raw-sql-baseline.constant";
import { TEST_FILE_PATTERN } from "#node/constants/test-file-pattern.constant";
import { checkImports } from "#node/functions/check-imports.function";
import { checkIosFormFactor } from "#node/functions/check-ios-form-factor.function";
import { checkIsolationTier } from "#node/functions/check-isolation-tier.function";
import { checkMemberFiles } from "#node/functions/check-member-files.function";
import { checkMemberMetadata } from "#node/functions/check-member-metadata.function";
import { checkRawSql } from "#node/functions/check-raw-sql.function";
import { checkForkingPeers } from "#node/functions/check-forking-peers.function";
import { checkHostedPeers } from "#node/functions/check-hosted-peers.function";
import { checkEncoreService } from "#node/functions/check-encore-service.function";
import { encoreReferenceVersion } from "#node/functions/encore-reference-version.function";
import { checkMember } from "#node/functions/check-member.function";
import { checkNativeModules } from "#node/functions/check-native-modules.function";
import { checkPublicIdPrefixes } from "#node/functions/check-public-id-prefixes.function";
import { checkRunwayFiles } from "#node/functions/check-runway-files.function";
import { checkRunwaySchemas } from "#node/functions/check-runway-schemas.function";
import { checkRunwayUnreadFields } from "#node/functions/check-runway-unread-fields.function";
import { checkService } from "#node/functions/check-service.function";
import { checkTestPlacement } from "#node/functions/check-test-placement.function";
import { checkWranglerOperationalKeys } from "#node/functions/check-wrangler-operational-keys.function";
import { checkWindowSizing } from "#node/functions/check-window-sizing.function";
import { checkWorkflowTriggers } from "#node/functions/check-workflow-triggers.function";
import { checkMiseActionVersion } from "#node/functions/check-mise-action-version.function";
import { fillTemplateTokens } from "#node/functions/fill-template-tokens.function";
import { isExpoAppConfig } from "#node/functions/is-expo-app-config.function";
import { isMemberSource } from "#node/functions/is-member-source.function";
import { isRawSqlSource } from "#node/functions/is-raw-sql-source.function";
import { isWranglerConfig } from "#node/functions/is-wrangler-config.function";
import { isRunwayFile } from "#node/functions/is-runway-file.function";
import { anonymousSurfacesOf } from "#node/functions/anonymous-surfaces-of.function";
import { listMembers } from "#node/functions/list-members.function";
import { readJsonc } from "#node/functions/read-jsonc.function";
import { tierFor } from "#node/functions/tier-for.function";
import type { PackageManifest } from "#node/types/package-manifest.type";
import type { RawFinding } from "#node/types/raw-finding.type";
import type { RepoContext } from "#node/types/repo-context.type";
import type { RunwayApi } from "#node/types/runway-api.type";

/** The runway member inside this repository (core); products use the installed package. */
const RUNWAY_DIR = "packages/developer/runway";

/** The member that owns `STACKRA_MANIFEST_SCHEMA`, and its built `./contracts` entry. */
const SKILLS_DIR = "packages/developer/skills";
const SKILLS_CONTRACTS = `${SKILLS_DIR}/dist/contracts.mjs`;

/**
 * The one `stackra` field schema, from the built `@stackra/skills/contracts`, or undefined before it is built: its
 * sources import `@stackra/contracts`, which plain Node loads only from its build (ADR 0233).
 */
async function loadManifestSchema(
  root: string,
): Promise<Parameters<typeof checkMemberMetadata>[0]["schema"]> {
  const entry = join(root, SKILLS_CONTRACTS);
  if (!existsSync(entry)) return undefined;
  const contracts = (await import(pathToFileURL(entry).href)) as {
    readonly STACKRA_MANIFEST_SCHEMA: Parameters<typeof checkMemberMetadata>[0]["schema"];
  };
  return contracts.STACKRA_MANIFEST_SCHEMA;
}

/** An app's own source, where a screen lays itself out. */
const isAppSource = (p: string): boolean =>
  /^(?:apps|tools\/scaffold\/templates\/apps)\/[^/]+\/src\/.+\.(?:ts|tsx)$/.test(p) &&
  !p.includes("/__tests__/");

/**
 * The built `@stackra/runway` entry, or undefined before it is built or when it is not installed: its sources use
 * extensionless `#core/*` imports that plain Node cannot load (ADR 0233).
 */
async function loadRunway(root: string): Promise<RunwayApi | undefined> {
  const dir = join(root, RUNWAY_DIR);
  let entry: string | undefined;
  if (existsSync(join(dir, "package.json"))) {
    const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8")) as {
      readonly exports: Record<string, { readonly default: string }>;
    };
    entry = join(dir, pkg.exports["."]?.default ?? "dist/index.mjs");
  } else {
    try {
      entry = createRequire(join(root, "package.json")).resolve("@stackra/runway");
    } catch {
      return undefined;
    }
  }
  return existsSync(entry) ? ((await import(pathToFileURL(entry).href)) as RunwayApi) : undefined;
}

/**
 * The structure findings of the repository.
 *
 * @param context - the root and its file list.
 * @param options - `ci` makes an unbuilt local runway member a finding; `warn` receives notices.
 * @example
 * await structureFindings(readRepoContext(root), { ci: false, warn: console.warn });
 */
export async function structureFindings(
  context: RepoContext,
  options: { readonly ci: boolean; readonly warn: (text: string) => void },
): Promise<RawFinding[]> {
  const { root, files } = context;
  const out: RawFinding[] = [];
  const report = (rule: string, dir: string, texts: readonly string[]): void => {
    for (const text of texts) out.push({ rule, dir, text });
  };
  const text = (p: string): string => readFileSync(join(root, p), "utf8");
  const maybe = (p: string): string | undefined =>
    existsSync(join(root, p)) ? text(p) : undefined;
  const members = listMembers(root);

  const manifests = members.flatMap(({ dir }) => {
    const file = `${dir}/stackra.manifest.json`;
    if (!(dir.startsWith("services/") || dir.startsWith("apps/")) || !files.includes(file))
      return [];
    const source = text(file);
    try {
      return [{ dir, manifest: JSON.parse(source) as unknown }];
    } catch {
      // Other checks report malformed manifests.
      return [];
    }
  });
  report("public-id-prefixes", "", checkPublicIdPrefixes(manifests));

  report("test-placement", "", checkTestPlacement(files));
  for (const p of files.filter((f) => TEST_FILE_PATTERN.test(f)))
    report("isolation-tier", "", checkIsolationTier(p, text(p)));
  report(
    "workflow-triggers",
    "",
    checkWorkflowTriggers(
      files
        .filter((p) => /^\.github\/workflows\/[^/]+\.ya?ml$/.test(p))
        .map((p): [string, string] => [p, text(p)]),
    ),
  );
  report(
    "mise-action-version",
    "",
    checkMiseActionVersion(
      files
        .filter((p) => /^\.github\/(?:workflows\/[^/]+|actions\/[^/]+\/action)\.ya?ml$/.test(p))
        .map((p): [string, string] => [p, text(p)]),
    ),
  );
  if (existsSync(join(root, RUNWAY_DIR))) {
    report("runway-schemas", "", checkRunwaySchemas(maybe));
    report("runway-unread-fields", "", checkRunwayUnreadFields(maybe, files));
  }
  for (const p of files.filter(isWranglerConfig))
    report("wrangler-operational-keys", "", checkWranglerOperationalKeys(p, text(p)));
  const runwayFiles = files.filter(isRunwayFile);
  if (runwayFiles.length) {
    const runway = await loadRunway(root);
    // CI builds before it validates, so an unbuilt package there is a broken gate; locally it is only a notice.
    if (runway)
      report(
        "runway-files",
        "",
        checkRunwayFiles({
          files: runwayFiles,
          read: (p) => fillTemplateTokens(p, text(p)),
          runway,
          services: members
            .map(({ dir }) => dir)
            .filter((dir) => /^services\/[^/]+$/.test(dir))
            .map((dir) => dir.slice("services/".length)),
        }),
      );
    else if (options.ci && existsSync(join(root, RUNWAY_DIR)))
      report("runway-files", RUNWAY_DIR, [
        "not built, so no runway file was checked: build @stackra/runway before `pnpm validate`",
      ]);
    else
      options.warn(
        `validate: ${runwayFiles.length} runway file(s) not checked: @stackra/runway is not built (pnpm turbo run build --filter=@stackra/runway)`,
      );
  }
  for (const p of files.filter(isMemberSource)) report("imports", "", checkImports(p, text(p)));
  for (const p of files.filter(isRawSqlSource))
    report("raw-sql", "", checkRawSql(p, text(p), RAW_SQL_BASELINE[p] ?? 0));
  for (const p of files.filter(isExpoAppConfig))
    report("ios-form-factor", "", checkIosFormFactor(p, text(p)));
  report(
    "native-modules",
    "",
    checkNativeModules(
      files,
      (dir) => (JSON.parse(maybe(`${dir}/package.json`) ?? "{}") as PackageManifest).files,
    ),
  );
  for (const p of files.filter(isAppSource))
    report("window-sizing", "", checkWindowSizing(p, text(p)));
  // ADR 0453 decision 11 (amendment of 2026-10-27): the member metadata rules are the Stackra repository's own.
  const isStackraRepo =
    (JSON.parse(maybe("package.json") ?? "{}") as PackageManifest).name === "stackra";
  // ADR 0024 decision 2: the brand marks carry their all-rights-reserved NOTICE (in the docs app since ADR 0302).
  if (
    isStackraRepo &&
    existsSync(join(root, "apps/docs")) &&
    !existsSync(join(root, "apps/docs/src/assets/brand/NOTICE"))
  )
    report("brand-notice", "apps/docs", ["src/assets/brand/NOTICE missing (ADR 0024)"]);

  const rootLicense = maybe("LICENSE");
  const manifestSchema = isStackraRepo ? await loadManifestSchema(root) : undefined;
  if (isStackraRepo && !manifestSchema) {
    // CI builds before it validates, as for runway; locally the other metadata rules still run.
    if (options.ci)
      report("member-metadata", SKILLS_DIR, [
        "not built, so no stackra field was checked against STACKRA_MANIFEST_SCHEMA: build @stackra/skills before `pnpm validate`",
      ]);
    else
      options.warn(
        "validate: stackra fields not checked against STACKRA_MANIFEST_SCHEMA: @stackra/skills is not built (pnpm turbo run build --filter=@stackra/skills)",
      );
  }
  // Every call an anonymous caller may make, listed so a new one shows in review (STA-2025).
  const anonymous = members.flatMap(({ path }) => {
    const file = join(path, "stackra.manifest.json");
    return existsSync(file)
      ? anonymousSurfacesOf(
          JSON.parse(readFileSync(file, "utf8")) as Parameters<typeof anonymousSurfacesOf>[0],
        )
      : [];
  });
  // A reviewed one is recorded with its reason; only the rest are named, so a new one stands out.
  const unreviewed = anonymous.filter((key) => !Object.hasOwn(REVIEWED_ANONYMOUS_SURFACES, key));
  if (unreviewed.length > 0)
    options.warn(
      `validate: ${unreviewed.length} anonymous-callable action(s) and query(ies) not yet reviewed, past the permission and record-policy steps for a caller with no session (not in REVIEWED_ANONYMOUS_SURFACES of @stackra/repo-checks): ${unreviewed.join(", ")}`,
    );
  const catalogEncore = encoreReferenceVersion(maybe("package.json"), maybe("pnpm-workspace.yaml"));
  for (const { dir, path } of members) {
    const at = (f: string): unknown =>
      existsSync(join(path, f)) ? readJsonc(join(path, f)) : undefined;
    const read = (f: string): string | undefined =>
      existsSync(join(path, f)) ? readFileSync(join(path, f), "utf8") : undefined;
    const pkg = JSON.parse(readFileSync(join(path, "package.json"), "utf8")) as PackageManifest;
    report(
      "member",
      dir,
      checkMember({
        dir,
        pkg,
        stackra: isStackraRepo,
        turbo:
          dir === ""
            ? undefined
            : (at("turbo.jsonc") as Parameters<typeof checkMember>[0]["turbo"]),
        tsconfig:
          dir === ""
            ? undefined
            : (at("tsconfig.json") as Parameters<typeof checkMember>[0]["tsconfig"]),
      }),
    );
    if (isStackraRepo && dir !== "")
      report(
        "member-metadata",
        dir,
        checkMemberMetadata({
          dir,
          pkg,
          turbo: at("turbo.jsonc") as Parameters<typeof checkMemberMetadata>[0]["turbo"],
          schema: manifestSchema,
          files: readdirSync(path),
        }),
      );
    if (dir !== "")
      report(
        "member-files",
        dir,
        checkMemberFiles({
          dir,
          pkg,
          files: readdirSync(path),
          agents: read("AGENTS.md"),
          licenseText: read("LICENSE"),
          rootLicense,
          stackra: isStackraRepo,
        }),
      );
    // A library's peers never fork its dependents' installs (FORKING_PEERS).
    if (tierFor(dir) === "tier:lib") report("forking-peers", dir, checkForkingPeers(pkg));
    // A library takes the packages whose values carry an identity in the host as peers (HOSTED_PEER_PACKAGES).
    if (tierFor(dir) === "tier:lib")
      report(
        "hosted-peers",
        dir,
        checkHostedPeers({
          pkg,
          sources: files
            .filter(
              (p) => p.startsWith(`${dir}/src/`) && /\.tsx?$/.test(p) && !p.includes("/__tests__/"),
            )
            .map((p) => readFileSync(join(root, p), "utf8")),
        }),
      );
    if (tierFor(dir) === "tier:service")
      report(
        "service",
        dir,
        checkEncoreService({
          pkg,
          tsconfig: at("tsconfig.json") as Parameters<typeof checkEncoreService>[0]["tsconfig"],
          catalogEncore,
        }),
      );
    if (tierFor(dir) === "tier:service")
      report(
        "service",
        dir,
        checkService({
          dir,
          pkg,
          paths: files.filter((p) => p.startsWith(`${dir}/`)).map((p) => p.slice(dir.length + 1)),
        }),
      );
  }
  return out;
}
