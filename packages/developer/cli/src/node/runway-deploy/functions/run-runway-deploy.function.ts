/**
 * Stackra file contract:
 * Purpose: `runRunwayDeploy(context)`, the run of `stackra deploy --env <environment> [--kind <kind,…>]
 *          [--member <key,…>] [--sha <sha>] [--from-env] [--dry-run]` at a repository root: reads the root `runway.yaml` and ships
 *          the commit (the checked-out `HEAD` unless `--sha`) to every target of the environment through Runway's
 *          `deploy()` and its providers (`encore-cloud`, `eas`, `mintlify`, `cloudflare-workers`). `--kind` keeps the
 *          targets of those kinds, `--member` the named Worker members. A dry run prints each target's plan. An
 *          environment whose runway declares `deploy.approval` ships only from the job behind it, proved by its
 *          GitHub OIDC token (`proveApproval`; `--approved` proves nothing, ADR 0468, STA-2100), and one deploy
 *          of an environment runs at a time on a host (`withDeployLock` over `fileDeployLock`). In a product
 *          repository (a root runway with `surfaces` or `mobile`), the web and mobile kinds ship through the
 *          product publish (`runDeployProduct`, the former `--product` path, which stays as an alias) inside the
 *          same lock, and the other kinds through `deploy()`; with `--member` the named Worker members ship through
 *          the Workers provider and the product publish does not run. A runway with `secrets.sync: on-deploy` syncs the
 *          services' secrets into Encore (`syncSecrets`; from the job's environment, a decrypted sops scope, with
 *          `--from-env`, else from Infisical) first, inside the lock, whenever the deploy
 *          ships services, and then the Workers provider reads a Worker's secrets from Infisical too; a dry run prints
 *          the sync's names and writers.
 * Boundary: the CLI picks the providers and prints; every change is a provider's. Logins are each provider CLI's own
 *           (OIDC in CI), and Worker ids and vars are read by the provider from this process's environment (its
 *           secrets too, unless the runway syncs on deploy).
 * Runtime: node
 * Governing contract: ADR 0352 (decisions 1, 3 and 6); ADR 0173; STA-1921; STA-606.
 */
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  deploy,
  deployTargets,
  DeployKind,
  RunwayEnvironment,
  surfaceHosts,
  withDeployLock,
} from "@stackra/runway";
import {
  fileDeployLock,
  readRunway,
  readRunways,
  runProgram,
  syncSecrets,
} from "@stackra/runway/node";

import { probeHosts } from "#node/doctor/functions/probe-hosts.function";
import { CliUsageError } from "#node/errors/cli-usage.error";
import { runDeployProduct } from "#node/product/functions/run-deploy-product.function";
import { printDeployResults } from "#node/runway-deploy/functions/print-deploy-results.function";
import { proveApproval } from "#node/runway-deploy/functions/prove-approval.function";
import { runwayProviders } from "#node/runway-deploy/functions/runway-providers.function";
import type { CliContext } from "#node/types/cli-context.type";

/** Where the deploy locks of this host live. */
const LOCKS = join(tmpdir(), "stackra-runway-locks");

/** A comma list; empty counts as missing. */
function list(value: string | boolean | undefined): string[] | undefined {
  const items =
    typeof value === "string"
      ? value
          .split(",")
          .map((item) => item.trim())
          .filter((item) => item !== "")
      : [];
  return items.length === 0 ? undefined : items;
}

/**
 * Deploys the commit to the environment's targets and resolves with the exit code.
 *
 * @throws CliUsageError when the environment or a kind is missing or unknown.
 * @throws CliUsageError when the environment declares an approval the job's OIDC token does not prove.
 * @throws RunwayLockedError when another deploy of the environment holds this host's lock.
 * @throws RunwayUnresolvedError when the secret sync cannot read or write a value; nothing has shipped then.
 * @throws RunwayDeployFailedError at the first target that does not verify.
 * @example
 * await runRunwayDeploy({ ...context, values: { env: "production", kind: "web", member: "registry" } });
 */
export async function runRunwayDeploy(context: CliContext): Promise<number> {
  const { cwd, io, values } = context;
  const environment = values["env"];
  const environments = Object.values(RunwayEnvironment) as string[];
  if (typeof environment !== "string" || !environments.includes(environment))
    throw new CliUsageError(`name the environment: --env <${environments.join("|")}>`);
  const kinds = list(values["kind"]);
  const known = Object.values(DeployKind) as string[];
  const unknown = kinds?.filter((kind) => !known.includes(kind)) ?? [];
  if (unknown.length > 0)
    throw new CliUsageError(`unknown --kind ${unknown.join(", ")}: one of ${known.join(", ")}`);

  const root = readRunway(join(cwd, "runway.yaml"), "root");
  const members = list(values["member"]);
  const providers = runwayProviders(root, cwd, members);
  const sha =
    typeof values["sha"] === "string"
      ? values["sha"]
      : (await runProgram("git", ["rev-parse", "HEAD"], { cwd })).trim();
  // A product's web surfaces and mobile apps ship through the product publish (edge KV, R2, EAS submit), not a
  // Runway provider; every other kind goes through `deploy()` (STA-1972). `--member` names Worker members, which ship
  // through the Workers provider, so it never starts the product publish nor asks for its facts.
  const productKinds = (
    members !== undefined
      ? []
      : [
          ...(root.surfaces === undefined ? [] : [DeployKind.Web]),
          ...(root.mobile === undefined ? [] : [DeployKind.Mobile]),
        ]
  ).filter((kind) => kinds === undefined || kinds.includes(kind));
  const only = (kinds ?? (Object.values(DeployKind) as string[])).filter(
    (kind) => !(productKinds as string[]).includes(kind),
  ) as DeployKind[];
  const product = productKinds.length === 0 ? undefined : productContext(context, productKinds);
  // ADR 0173: the services' secrets reach Encore before the services that read them ship.
  const sync = (dryRun: boolean) =>
    root.secrets?.sync === "on-deploy" && only.includes(DeployKind.Services)
      ? syncSecrets({
          environment,
          runways: readRunways(cwd),
          repository: cwd,
          dryRun,
          log: (line) => io.out(`${line}\n`),
          // ADR 0525: the values come from the job's environment (a decrypted sops scope), not Infisical.
          ...(values["from-env"] === true ? { fromEnv: true } : {}),
        })
      : Promise.resolve();

  if (values["dry-run"] === true) {
    await sync(true);
    for (const target of deployTargets(root, environment as RunwayEnvironment)) {
      if (!only.includes(target.kind)) continue;
      const provider = providers.find((candidate) => candidate.destination === target.destination);
      io.out(
        `${target.id} → ${target.destination}${provider === undefined ? " (no provider)" : ""}\n`,
      );
      for (const step of provider?.plan(target, sha) ?? [])
        io.out(`  ${step.cwd ?? "."}$ ${[step.command, ...step.args].join(" ")}\n`);
    }
    return product === undefined ? 0 : runDeployProduct(product);
  }

  // ADR 0468: an environment with an approval ships only from the job behind it, proved by its OIDC token.
  await proveApproval(root, environment, "deploys");
  // One deploy of an environment at a time on this host; the caller workflow's concurrency group serialises runners.
  const outcome = await withDeployLock(
    root,
    environment as RunwayEnvironment,
    fileDeployLock(LOCKS),
    async () => {
      await sync(false);
      if (product !== undefined) {
        const code = await runDeployProduct(product);
        if (code !== 0) return { code, results: [] };
      }
      const results =
        only.length === 0
          ? []
          : await deploy(root, environment as RunwayEnvironment, sha, providers, only);
      return { code: 0, results };
    },
  );
  printDeployResults(io, outcome.results);
  if (outcome.code !== 0 || !productKinds.includes(DeployKind.Web)) return outcome.code;
  // Per-host serving test (STA-267): every host of the host map must answer TLS after the product publish.
  const hosts = surfaceHosts(root, environment as RunwayEnvironment);
  const failed = (await probeHosts(hosts)).filter((probe) => !probe.ok);
  for (const probe of failed)
    io.out(`${probe.host} ${probe.address || "no address"} does not serve\n`);
  return failed.length === 0 ? 0 : 1;
}

/** The context of the product publish for `kinds` (web, mobile): the same flags, scoped to those kinds. */
function productContext(context: CliContext, kinds: readonly DeployKind[]): CliContext {
  const web = kinds.includes(DeployKind.Web);
  const mobile = kinds.includes(DeployKind.Mobile);
  return {
    ...context,
    values: {
      ...context.values,
      product: true,
      ...(web && !mobile ? { "surfaces-only": true } : {}),
      ...(mobile && !web ? { "mobile-only": true } : {}),
    },
  };
}
