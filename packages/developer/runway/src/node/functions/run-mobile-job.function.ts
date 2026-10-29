/**
 * Stackra file contract:
 * Purpose: `runMobileJob(request)`, the mobile job: started by a merge (no variant) or by an OS event for a scope (a
 *          white-label variant), it reads the app from the root runway's `mobile`, checks the white-label mode and the
 *          store accounts, refuses a white-label build under the platform's Apple account until the 4.2.6 and 4.3
 *          checks are recorded as passed, writes the template checkout's Expo config with the capability flags applied
 *          (unused plugins, native modules, permission strings and entitlements left out), and starts the build
 *          through the `eas` provider on the app's EAS channel. With `line`, it first checks the app's template line
 *          out into `templateDir` (`checkoutLine`, a git checkout of the release) and commits the written config there,
 *          so EAS builds exactly that commit.
 * Boundary: reads the root runway, the record file and the template's `app.json`, `capabilities.json` and
 *           `package.json`; writes only `app.json`, `package.json` and, with `packages`, the product module in the
 *           template checkout (and, with `line`, the checkout itself); runs `npm`, `tar`, `git` and `eas` through the
 *           command runner, so `dryRunCommand` makes the whole job a dry run that still writes the generated config.
 *           Store submission and the scope theme's icon and splash (stackra-13) are not this job's; `buildOnly` skips
 *           the store account check for a build that submits later. Store accounts arrive resolved (`storeAccountsOf`).
 * Runtime: node
 * Governing contract: ADR 0439 (decisions 2, 3, 7 and 8, and enforcement); ADR 0352 (decision 3); ADR 0180 and ADR
 *                     0344 (EAS builds); app-shells D3, D13, D14.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { buildConfig } from "@stackra/config";

import { RunwayConfig } from "#config/runway.config";
import { DeployKind } from "#core/enums/deploy-kind.enum";
import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import type { DeployTarget } from "#core/types/deploy-target.type";
import type { RunwayIssue } from "#core/types/runway-issue.type";
import { APPLE_GUIDELINE_CHECKS } from "#node/constants/apple-guideline-checks.constant";
import { APPLE_GUIDELINE_RECORD } from "#node/constants/apple-guideline-record.constant";
import { LINE_CHECKOUT_SETTINGS } from "#node/constants/line-checkout-settings.constant";
import { MOBILE_DEV_SETTINGS } from "#node/constants/mobile-dev-settings.constant";
import { EasProviderDriver } from "#node/drivers/eas-provider.driver";
import { capabilityConfig } from "#node/functions/capability-config.function";
import { checkoutLine } from "#node/functions/checkout-line.function";
import { expoConfigOf } from "#node/functions/expo-config-of.function";
import { readRunway } from "#node/functions/read-runway.function";
import { runCommand } from "#node/functions/run-command.function";
import type { LineCheckout } from "#node/types/line-checkout.type";
import type { MobileCapability } from "#node/types/mobile-capability.type";
import type { MobileJobRequest } from "#node/types/mobile-job-request.type";
import type { MobileJobResult } from "#node/types/mobile-job-result.type";

type Block = Record<string, unknown>;

/** The parsed JSON file at `file`, or `fallback` when it does not exist. */
function readJson(file: string, fallback?: Block): Block {
  let text: string;
  try {
    text = readFileSync(file, "utf8");
  } catch (error) {
    if (fallback !== undefined && (error as { code?: string }).code === "ENOENT") return fallback;
    throw new RunwayUnresolvedError(`The mobile job cannot read ${file}`);
  }
  try {
    const value: unknown = JSON.parse(text);
    if (typeof value === "object" && value !== null && !Array.isArray(value)) return value as Block;
  } catch {
    // reported below
  }
  throw new RunwayInvalidError(file, [{ path: "", message: "Expected a JSON object" }]);
}

/** `block[key]` as an object. */
function blockOf(block: Block, key: string): Block {
  const value = block[key];
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Block)
    : {};
}

/**
 * Runs the mobile job for one app (and one scope).
 *
 * @param request - the repository, app, template checkout (or the line source to check it out from), commit,
 *        environment, store accounts and variant.
 * @throws RunwayInvalidError when the app is not in the runway `mobile`, is not white-label for a variant, offers no
 *         mode a store account needs, lacks a store account for a platform it targets, has no EAS channel, or lists a
 *         capability the template line does not offer.
 * @throws RunwayUnresolvedError when a white-label build would publish under the platform's Apple account before the
 *         4.2.6 and 4.3 checks are recorded as passed, or a template file cannot be read.
 * @example
 * await runMobileJob({
 *   repository: ".", app: "staff", templateDir: ".stackra/mobile/staff", sha, environment: "production",
 *   stores: storeAccountsOf(root.mobile.staff),
 * });
 */
export async function runMobileJob(request: MobileJobRequest): Promise<MobileJobResult> {
  const { repository, app, templateDir, variant, stores } = request;
  const root = readRunway(join(repository, "runway.yaml"), "root");
  const entry = root.mobile?.[app];
  const at = `mobile.${app}`;
  if (entry === undefined) {
    throw new RunwayInvalidError("runway.yaml", [
      { path: at, message: "No such mobile app in the root runway" },
    ]);
  }

  const identity = { ...entry.identity, ...variant?.identity };
  const issues: RunwayIssue[] = [];
  const needs = [
    ...(identity.ios === undefined ? [] : (["app_store"] as const)),
    ...(identity.android === undefined ? [] : (["google_play"] as const)),
  ];
  if (needs.length === 0) {
    issues.push({ path: `${at}.identity`, message: "The app targets neither ios nor android" });
  }
  for (const store of request.buildOnly === true ? [] : needs) {
    if (!stores.some((account) => account.store === store)) {
      issues.push({ path: `${at}.stores`, message: `No account publishes to ${store}` });
    }
  }
  if (variant !== undefined) {
    const modes = entry.whiteLabel?.modes ?? ["managed", "bring-your-own"];
    if (entry.whiteLabel === undefined) {
      issues.push({ path: `${at}.whiteLabel`, message: "The app has no white-label variants" });
    }
    for (const account of stores) {
      const mode = account.owner === "scope" ? "bring-your-own" : "managed";
      if (!modes.includes(mode)) {
        issues.push({ path: `${at}.whiteLabel.modes`, message: `The app does not offer ${mode}` });
      }
    }
  }
  if (request.line === undefined && request.sha === undefined) {
    issues.push({
      path: "sha",
      message: "Name the commit checked out in templateDir, or pass line",
    });
  }
  const channel = entry.eas?.channel;
  if (channel === undefined) {
    issues.push({ path: `${at}.eas.channel`, message: "Name the EAS channel the app builds on" });
  }
  if (issues.length > 0) throw new RunwayInvalidError("runway.yaml", issues);

  const managedApple = stores.some(
    (account) => account.store === "app_store" && account.owner === "platform",
  );
  if (variant !== undefined && managedApple) {
    const record =
      entry.store === undefined
        ? {}
        : readJson(join(repository, entry.store, APPLE_GUIDELINE_RECORD), {});
    const open = APPLE_GUIDELINE_CHECKS.filter(
      (guideline) => blockOf(record, guideline)["result"] !== "pass",
    );
    if (open.length > 0) {
      throw new RunwayUnresolvedError(
        `A white-label build under the platform's Apple account waits on Apple guideline ${open.join(" and ")}: record each check as passed in ${entry.store ?? `${at}.store`}/${APPLE_GUIDELINE_RECORD}`,
      );
    }
  }

  const run = request.run ?? runCommand;
  let template: LineCheckout | undefined;
  if (request.line !== undefined) {
    template = await checkoutLine({
      ...request.line,
      line: entry.template,
      into: templateDir,
      git: true,
      run,
    });
  }

  const appJson = readJson(join(templateDir, "app.json"));
  const catalogue = readJson(join(templateDir, "capabilities.json")) as Record<
    string,
    MobileCapability
  >;
  const capabilities = capabilityConfig(catalogue, entry.capabilities ?? [], `${at}.capabilities`);
  const config = expoConfigOf(blockOf(appJson, "expo"), {
    project: root.project,
    app,
    entry,
    capabilities,
    variant,
  });
  writeFileSync(
    join(templateDir, "app.json"),
    `${JSON.stringify({ ...appJson, expo: config }, null, 2)}\n`,
  );

  const packageFile = join(templateDir, "package.json");
  const manifest = readJson(packageFile);
  const packages = request.packages ?? {};
  const names = Object.keys(packages);
  if (names.length > 0) {
    // The product packages build into the app from the registry; the template's product module imports them.
    manifest["dependencies"] = { ...blockOf(manifest, "dependencies"), ...packages };
    writeFileSync(
      join(templateDir, MOBILE_DEV_SETTINGS.productModules),
      [
        "// Written by Runway's mobile job from the root runway's packages; never committed to the template line.",
        ...names.map(
          (name, index) =>
            `import * as p${index} from ${JSON.stringify(`${name}/${MOBILE_DEV_SETTINGS.nativeExport.slice(2)}`)};`,
        ),
        "",
        `export const PRODUCT_MODULES: readonly { readonly register?: unknown; readonly default?: unknown }[] = [${names.map((_, index) => `p${index}`).join(", ")}];`,
        "",
      ].join("\n"),
    );
  }
  const expo = blockOf(manifest, "expo");
  const autolinking = blockOf(expo, "autolinking");
  const exclude = Array.isArray(autolinking["exclude"]) ? (autolinking["exclude"] as string[]) : [];
  writeFileSync(
    packageFile,
    `${JSON.stringify(
      {
        ...manifest,
        expo: {
          ...expo,
          autolinking: {
            ...autolinking,
            exclude: [...new Set([...exclude, ...capabilities.excludedModules])],
          },
        },
      },
      null,
      2,
    )}\n`,
  );

  let sha = request.sha;
  if (template !== undefined) {
    const author = LINE_CHECKOUT_SETTINGS.gitIdentity;
    await run("git", ["add", "--all"], { cwd: templateDir });
    await run(
      "git",
      [
        ...author,
        "commit",
        "--quiet",
        "--no-verify",
        "--message",
        `runway: ${at} on ${template.package}@${template.version}`,
      ],
      { cwd: templateDir },
    );
    sha = (await run("git", ["rev-parse", "HEAD"], { cwd: templateDir })).trim();
  }
  if (sha === undefined || sha === "") {
    throw new RunwayUnresolvedError(`The template checkout ${templateDir} has no commit to build`);
  }

  const target: DeployTarget = {
    id: `${request.environment}/mobile/${app}${variant === undefined ? "" : `/scope:${variant.scope}`}`,
    environment: request.environment,
    kind: DeployKind.Mobile,
    destination: "eas",
    settings: {
      release: "build",
      platform: needs.length === 2 ? "all" : needs[0] === "app_store" ? "ios" : "android",
    },
    scope: { mobile: { profile: channel } },
  };
  // The template checkout is any folder, which the config schema (folders inside the repository) refuses.
  const eas = Object.assign(new EasProviderDriver(buildConfig(RunwayConfig)), {
    projectDir: templateDir,
    run,
  });
  const record = await eas.apply(target, sha);

  return {
    app,
    ...(variant === undefined ? {} : { scope: variant.scope }),
    config,
    record,
    stores,
    ...(template === undefined ? {} : { template }),
  };
}
