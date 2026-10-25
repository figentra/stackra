/**
 * Stackra file contract:
 * Purpose: `bootApp`, the boot every target's `createApp` shares: it builds each configuration class of the wiring
 *          from the target's raw environment (secrets by name from the same source), binds the wiring itself as
 *          `AppWiring`, boots the container with those instances in place of their classes, and picks the error
 *          reporter.
 * Boundary: boots; it starts nothing (no server, no window, no render). A configuration that breaks its rule or a
 *           required secret that is missing throws `ConfigInvalidError` naming it, and a port with no driver throws
 *           `UnresolvedPortError`, so a bad environment fails boot instead of a later call. A host override is built
 *           in place of its base and bound under the base, so a package that injects its base gets the host's values.
 * Runtime: isomorphic
 * Governing contract: ADR 0295 (decisions 7, 8 and 10); ADR 0294 (decisions 17 and 19); ADR 0263 (decisions 1, 9
 *                     and 11); ADR 0173.
 */
import { buildConfig } from "@stackra/config";
import type { Config } from "@stackra/config";
import { Container } from "@stackra/container";
import type { ContainerOptions, Token, Wiring } from "@stackra/container";
import { ErrorReporter } from "@stackra/errors/contracts";

import { ConsoleErrorReporterDriver } from "#core/drivers/console-error-reporter.driver";
import { envSecrets } from "#core/functions/env-secrets.function";
import { AppWiring } from "#core/services/app-wiring.service";
import type { AppSections } from "#core/types/app-sections.type";
import type { BootedApp } from "#core/types/booted-app.type";
import type { BootOptions } from "#core/types/boot-options.type";

/**
 * Boots the container of `wiring`.
 *
 * @throws ConfigInvalidError when a configuration value breaks its rule or a required secret is missing.
 * @throws UnresolvedPortError when a port has no driver and nothing overrides it.
 * @example
 * const { container, reporter } = await bootApp(wiring, { roots: [CommerceModule], env: process.env });
 */
export async function bootApp(
  wiring: Wiring & AppSections,
  options: BootOptions = {},
): Promise<BootedApp> {
  const env = options.env ?? {};
  const secrets = envSecrets(env);
  const overrides = new Map<Token, object>(options.overrides);
  for (const entry of wiring.config ?? []) {
    if (overrides.has(entry.provide)) continue;
    const type = (entry.override ?? entry.provide) as new () => Config;
    overrides.set(entry.provide, buildConfig(type, { env, secrets }));
  }
  overrides.set(AppWiring, new AppWiring(wiring));
  const containerOptions: ContainerOptions =
    options.roots === undefined ? { overrides } : { overrides, roots: options.roots };
  const container = await Container.create([wiring], containerOptions);
  const reporter = container.has(ErrorReporter)
    ? container.get(ErrorReporter)
    : new ConsoleErrorReporterDriver();
  return { container, reporter, wiring };
}
