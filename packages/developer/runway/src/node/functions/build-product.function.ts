/**
 * Stackra file contract:
 * Purpose: `buildProduct(request)`, the build of a product that has no app members (`stackra build --product`):
 *          - per web surface: checks its shell line out, generates a bundle entry that loads every product package's
 *            `./<surface>` entry, has the bundler build it against the shell's import map into the folder the publish
 *            step reads, and writes the bundle manifest;
 *          - per mobile app: runs the mobile job (the template line checked out, the app's config and capability flags
 *            written, the product packages built in), with the EAS build;
 *          - writes the build manifest (`dist/product/build.json`).
 *          A dry run plans the bundles and records the EAS builds instead of starting them; the checkouts, the
 *          generated config and the manifest are still written, so the outputs can be checked.
 * Boundary: writes under the product root only (`.stackra/`, `dist/`); builds through the given bundler, so Runway
 *           carries no build tool. Store accounts are checked when the app is submitted (`deployProduct`), not here.
 *           `ops` has no shell of a product's and is skipped.
 * Runtime: node
 * Governing contract: ADR 0436 (decisions 2 and 4); ADR 0439 (decisions 2 and 3); ADR 0441 (decision 3); ADR 0481.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

import { RunwayEnvironment } from "#core/enums/runway-environment.enum";
import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import type { DeployStep } from "#core/types/deploy-step.type";
import type { RunwayIssue } from "#core/types/runway-issue.type";
import { EDGE_PUBLISH_SETTINGS } from "#node/constants/edge-publish-settings.constant";
import { LINE_CHECKOUT_SETTINGS } from "#node/constants/line-checkout-settings.constant";
import { MOBILE_DEV_SETTINGS } from "#node/constants/mobile-dev-settings.constant";
import { PRODUCT_BUILD_SETTINGS } from "#node/constants/product-build-settings.constant";
import { checkoutLine } from "#node/functions/checkout-line.function";
import { dryRunCommand } from "#node/functions/dry-run-command.function";
import { readRunway } from "#node/functions/read-runway.function";
import { runCommand } from "#node/functions/run-command.function";
import { runMobileJob } from "#node/functions/run-mobile-job.function";
import { entryOf } from "#node/functions/entry-of.function";
import { workspacePackages } from "#node/functions/workspace-packages.function";
import type { BundleManifest } from "#node/types/bundle-manifest.type";
import type { LineSource } from "#node/types/line-source.type";
import type { ProductBuild } from "#node/types/product-build.type";
import type { ProductBuildRequest } from "#node/types/product-build-request.type";

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

/** The parts of `<owner>/<name>@<major>`. */
function partsOf(line: string): { owner: string; name: string; major: string } {
  const [owner = "", rest = ""] = line.split("/");
  const [name = "", major = ""] = rest.split("@");
  return { owner, name, major };
}

/**
 * Builds the product.
 *
 * @throws RunwayInvalidError naming every package that is missing or lacks the surface's export, and every bundle that
 *         cannot be built without a bundler.
 * @example
 * const build = await buildProduct({ repository: ".", scope: "@figentra", bundle: viteBundler });
 * build.surfaces.console?.bundle?.entry; // "console.1a2b3c.js"
 */
export async function buildProduct(request: ProductBuildRequest): Promise<ProductBuild> {
  const repository = resolve(request.repository);
  const root = readRunway(join(repository, "runway.yaml"), "root");
  const real = request.run ?? runCommand;
  const sha = request.sha ?? (await real("git", ["rev-parse", "HEAD"], { cwd: repository })).trim();
  // A dry run records the EAS builds only; checkouts and the generated config are local and really written.
  const run =
    request.dryRun === true
      ? dryRunCommand({
          head: sha,
          answer: (command, args, cwd) =>
            command === "eas" ? undefined : real(command, args, { cwd }),
        })
      : real;
  const version = sha.slice(0, 12);
  const workspace = workspacePackages(repository);
  const source = (line: string): LineSource => {
    const { owner, name } = partsOf(line);
    return {
      scope: request.scope,
      cwd: repository,
      ...(request.os !== undefined && owner === "os"
        ? { local: resolve(request.os, "apps", name) }
        : {}),
    };
  };

  const issues: RunwayIssue[] = [];
  const surfaces: Mutable<ProductBuild["surfaces"]> = {};
  for (const [surface, entry] of Object.entries(root.surfaces ?? {})) {
    if (surface === "ops" || entry === undefined || !("shell" in entry)) continue;
    const at = `surfaces.${surface}`;
    const entries = (entry.packages ?? []).flatMap((name, index) => {
      const pkg = workspace.get(name);
      const file = pkg === undefined ? undefined : entryOf(pkg, `./${surface}`);
      if (file === undefined)
        issues.push({
          path: `${at}.packages.${index}`,
          message:
            pkg === undefined
              ? `${name} is not a package under packages/`
              : `${name} has no ./${surface} export`,
        });
      return file === undefined ? [] : [{ name, file }];
    });
    if (entries.length > 0 && request.dryRun !== true && request.bundle === undefined)
      issues.push({ path: at, message: "A surface with packages needs a bundler to build it" });

    const dir = join(repository, PRODUCT_BUILD_SETTINGS.lineDir(surface));
    rmSync(dir, { recursive: true, force: true });
    const shell = await checkoutLine({ ...source(entry.shell), line: entry.shell, into: dir, run });
    const mapFile = join(dir, LINE_CHECKOUT_SETTINGS.shellDist, "import-map.json");
    const importMap = existsSync(mapFile)
      ? (JSON.parse(readFileSync(mapFile, "utf8")) as { imports: Record<string, string> })
      : { imports: {} };
    if (!existsSync(mapFile))
      issues.push({
        path: at,
        message: `${shell.package}@${shell.version} has no built ${LINE_CHECKOUT_SETTINGS.shellDist}/import-map.json`,
      });

    const contentDir = entry.content === undefined ? undefined : join(repository, entry.content);
    const content =
      contentDir !== undefined && existsSync(contentDir)
        ? readdirSync(contentDir)
            .filter((file) => file.endsWith(".json"))
            .map((file) => `${entry.content}/${file}`)
        : [];

    let bundle: BundleManifest | undefined;
    if (entries.length > 0) {
      const entryFile = join(repository, PRODUCT_BUILD_SETTINGS.entryFile(surface));
      mkdirSync(dirname(entryFile), { recursive: true });
      writeFileSync(
        entryFile,
        [
          "// Written by Runway's product build from the root runway's packages; never committed.",
          ...entries.map(
            ({ file }, index) =>
              `import * as p${index} from ${JSON.stringify(relative(dirname(entryFile), file).replace(/^(?!\.)/, "./"))};`,
          ),
          "",
          "type Register = (shell: unknown) => unknown;",
          `const modules: readonly { readonly register?: unknown; readonly default?: unknown }[] = [${entries.map((_, index) => `p${index}`).join(", ")}];`,
          "",
          "/** Registers every product package's entry into the shell, in runway order. */",
          "export default async function register(shell: unknown): Promise<void> {",
          "  for (const module of modules) {",
          "    const entry = module.register ?? module.default;",
          '    if (typeof entry === "function") await (entry as Register)(shell);',
          "  }",
          "}",
          "",
        ].join("\n"),
      );
      const outDir = join(repository, EDGE_PUBLISH_SETTINGS.bundleDir, surface, version);
      if (request.dryRun !== true && request.bundle !== undefined && issues.length === 0) {
        rmSync(join(repository, EDGE_PUBLISH_SETTINGS.bundleDir, surface), {
          recursive: true,
          force: true,
        });
        const files = await request.bundle({
          root: repository,
          surface,
          entry: entryFile,
          importMap,
          outDir,
        });
        bundle = {
          package: root.product?.key ?? root.project,
          surface,
          targets: `${shell.name}@${shell.major}`,
          version,
          ...files,
        };
        writeFileSync(
          join(outDir, EDGE_PUBLISH_SETTINGS.manifestFile),
          `${JSON.stringify(bundle, null, 2)}\n`,
        );
      }
    }

    surfaces[surface] = {
      shell: {
        line: entry.shell,
        package: shell.package,
        version: shell.version,
        importMap: Object.keys(importMap.imports),
      },
      ...(entry.preset === undefined ? {} : { preset: entry.preset }),
      packages: entries.map(({ name }) => name),
      hosts: [
        ...(entry.host === undefined ? [] : [entry.host]),
        ...(entry.hosts ?? []).map((item) => item.host),
      ],
      ...(bundle === undefined ? {} : { bundle }),
      content,
    };
  }
  if (issues.length > 0) throw new RunwayInvalidError("runway.yaml", issues);

  const mobile: Mutable<ProductBuild["mobile"]> = {};
  for (const [app, entry] of Object.entries(root.mobile ?? {})) {
    const packages: Record<string, string> = {};
    for (const [index, name] of (entry.packages ?? []).entries()) {
      const pkg = workspace.get(name);
      if (pkg === undefined || entryOf(pkg, MOBILE_DEV_SETTINGS.nativeExport) === undefined)
        issues.push({
          path: `mobile.${app}.packages.${index}`,
          message:
            pkg === undefined
              ? `${name} is not a package under packages/`
              : `${name} has no ./native export`,
        });
      else packages[name] = pkg.version;
    }
    if (issues.length > 0) continue;
    const templateDir = join(repository, PRODUCT_BUILD_SETTINGS.mobileDir(app));
    rmSync(templateDir, { recursive: true, force: true });
    const result = await runMobileJob({
      repository,
      app,
      templateDir,
      line: source(entry.template),
      environment: request.environment ?? RunwayEnvironment.Production,
      stores: [],
      buildOnly: true,
      packages,
      run,
    });
    mobile[app] = {
      template: {
        line: entry.template,
        package: result.template?.package ?? "",
        version: result.template?.version ?? "",
      },
      dir: relative(repository, templateDir),
      capabilities: [...(entry.capabilities ?? [])],
      packages,
      buildIds: result.record.reference.split(",").filter((id) => id !== "" && id !== "undefined"),
    };
  }
  if (issues.length > 0) throw new RunwayInvalidError("runway.yaml", issues);

  const planned: DeployStep[] =
    "calls" in run ? (run.calls as DeployStep[]).filter((call) => call.command === "eas") : [];
  const build: ProductBuild = {
    product: root.product?.key ?? root.project,
    sha,
    version,
    dryRun: request.dryRun === true,
    surfaces,
    mobile,
    planned,
  };
  const manifest = join(repository, PRODUCT_BUILD_SETTINGS.manifest);
  mkdirSync(dirname(manifest), { recursive: true });
  writeFileSync(manifest, `${JSON.stringify(build, null, 2)}\n`);
  return build;
}
