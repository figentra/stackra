/**
 * Stackra file contract:
 * Purpose: `runDeployProduct(context)`, the run of `stackra deploy --product --env <environment> [--dry-run]
 *          [--approved] [--first-release]` at a product root: publishes the built web surfaces to the edge, lists the
 *          landing seeds and submits the mobile builds (Runway's `deployProduct`). The OS facts come from flags or the
 *          deploy job's environment: `--assets-bucket`/`STACKRA_ASSETS_BUCKET`, `--assets-origin`/`STACKRA_ASSETS_ORIGIN`,
 *          `--kv-namespace`/`STACKRA_EDGE_KV_NAMESPACE`, `--served`/`STACKRA_SERVED_SHELLS` and
 *          `--canary-scopes`/`STACKRA_CANARY_SCOPES` (comma lists), `--region`. A dry run fills what is missing with
 *          stand-ins (the served lines from the build) and records everything.
 * Boundary: the CLI gathers the facts and the platform store accounts (`mobile.<app>.stores`) and delegates; an
 *           environment whose runway names an approval deploys only with `--approved`, which the CI job behind the
 *           GitHub environment passes.
 * Runtime: node
 * Governing contract: ADR 0436 (decisions 4 and 13); ADR 0437; ADR 0439 (decision 7); ADR 0170 (approvals).
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { buildConfig } from "@stackra/config";
import { RunwayEnvironment } from "@stackra/runway";
import {
  deployProduct,
  EdgeKvConfig,
  PRODUCT_BUILD_SETTINGS,
  readRunway,
  WranglerEdgeKvDriver,
} from "@stackra/runway/node";
import type { MobileStoreAccount, ProductBuild } from "@stackra/runway/node";

import { CliUsageError } from "#node/errors/cli-usage.error";
import type { CliContext } from "#node/types/cli-context.type";

/** The value of `--<flag>`, else the environment variable `name`. */
function fact(values: CliContext["values"], flag: string, name: string): string | undefined {
  const value = values[flag];
  return typeof value === "string" ? value : process.env[name];
}

/** A comma list. */
const list = (value: string | undefined): string[] | undefined =>
  value === undefined
    ? undefined
    : value
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item !== "");

/**
 * Deploys the built product and resolves with the exit code.
 *
 * @throws CliUsageError when the environment is missing or unknown, or a real deploy lacks an OS fact.
 * @example
 * await runDeployProduct({ ...context, values: { product: true, env: "staging" } });
 */
export async function runDeployProduct(context: CliContext): Promise<number> {
  const { cwd, io, values } = context;
  const environment = values["env"];
  if (
    typeof environment !== "string" ||
    !(Object.values(RunwayEnvironment) as string[]).includes(environment)
  )
    throw new CliUsageError(
      `name the environment: --env <${Object.values(RunwayEnvironment).join("|")}>`,
    );
  const dryRun = values["dry-run"] === true;
  const root = readRunway(join(cwd, "runway.yaml"), "root");
  const manifest = join(cwd, PRODUCT_BUILD_SETTINGS.manifest);
  const build = existsSync(manifest)
    ? (JSON.parse(readFileSync(manifest, "utf8")) as ProductBuild)
    : undefined;

  const bucket =
    fact(values, "assets-bucket", "STACKRA_ASSETS_BUCKET") ?? (dryRun ? "dry-run" : undefined);
  const origin =
    fact(values, "assets-origin", "STACKRA_ASSETS_ORIGIN") ??
    (dryRun ? "https://assets.example.invalid" : undefined);
  const namespace = fact(values, "kv-namespace", "STACKRA_EDGE_KV_NAMESPACE");
  const served =
    list(fact(values, "served", "STACKRA_SERVED_SHELLS")) ??
    (dryRun && build !== undefined
      ? Object.values(build.surfaces).map((surface) => surface.shell.line.split("/")[1] ?? "")
      : undefined);
  const canaryScopes = list(fact(values, "canary-scopes", "STACKRA_CANARY_SCOPES"));
  const missing = [
    ...(bucket === undefined ? ["--assets-bucket"] : []),
    ...(origin === undefined ? ["--assets-origin"] : []),
    ...(namespace === undefined && !dryRun ? ["--kv-namespace"] : []),
    ...(served === undefined ? ["--served"] : []),
  ];
  if (missing.length > 0)
    throw new CliUsageError(`name ${missing.join(", ")} (or their STACKRA_* variables)`);

  const stores = Object.fromEntries(
    Object.entries(root.mobile ?? {}).map(([app, entry]) => {
      const accounts: MobileStoreAccount[] = [
        ...(entry.stores?.apple?.account === undefined
          ? []
          : [
              {
                store: "app_store" as const,
                owner: "platform" as const,
                account: entry.stores.apple.account,
              },
            ]),
        ...(entry.stores?.google?.account === undefined
          ? []
          : [
              {
                store: "google_play" as const,
                owner: "platform" as const,
                account: entry.stores.google.account,
              },
            ]),
      ];
      return [app, accounts];
    }),
  );
  const region = fact(values, "region", "STACKRA_REGION");
  const deploy = await deployProduct({
    repository: cwd,
    environment: environment as RunwayEnvironment,
    approved: values["approved"] === true,
    ...(namespace === undefined || dryRun
      ? {}
      : {
          kv: new WranglerEdgeKvDriver(
            buildConfig(EdgeKvConfig, { values: { namespaceId: namespace } }),
          ),
        }),
    assets: { bucket: bucket as string, origin: origin as string },
    served: served as string[],
    ...(canaryScopes === undefined ? {} : { canaryScopes }),
    firstRelease: values["first-release"] === true || (dryRun && canaryScopes === undefined),
    ...(region === undefined ? {} : { region }),
    stores,
    dryRun,
  });
  io.out(
    `deployed ${deploy.product} ${deploy.sha.slice(0, 12)} to ${environment}${dryRun ? " (dry run)" : ""}: ${deploy.surfaces.written.length} KV row(s), ${deploy.surfaces.uploaded.length} upload(s), ${Object.values(deploy.submitted).flat().length} mobile submission(s)\n`,
  );
  for (const [surface, documents] of Object.entries(deploy.seeds))
    io.out(
      `landing ${surface}: ${documents.length} seed document(s) listed; the import into experience is not wired yet\n`,
    );
  io.out(`wrote ${PRODUCT_BUILD_SETTINGS.deployManifest(environment)}\n`);
  return 0;
}
