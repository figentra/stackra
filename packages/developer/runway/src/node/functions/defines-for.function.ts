/**
 * Stackra file contract:
 * Purpose: `definesFor(member, environment)`, the bundler `define` map of an app member for one environment: each
 *          public var of its runway's `environments.<env>.vars` (`VITE_`, `EXPO_PUBLIC_`, `RENDERER_VITE_`) as
 *          `import.meta.env.<NAME>`, resolved; and `__STACKRA_RUNWAY__`, the member's resolved runway facts (its dev
 *          ports in dev; its desktop feed path, channel and the root feed origin elsewhere), which the `.` readers
 *          answer from inside the bundle.
 * Boundary: reads the member runway at the working directory (the member root, where the generated config runs), the
 *           root runway only for the feed origin, and the dev facts only when a value needs them. A server var
 *           (`STACKRA_*`) and the TLS file paths never reach the map; no secret is ever read.
 * Runtime: node
 * Governing contract: ADR 0296 (decision 1), ADR 0231 (decision 4: public prefixes), ADR 0254 (the feed), ADR 0295
 *                     (decision 5), ADR 0173.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";

import { Enum } from "@stackra/contracts";

import { RunwayEnvironment } from "#core/enums/runway-environment.enum";
import { RunwayKind } from "#core/enums/runway-kind.enum";
import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import { readDevFacts } from "#core/functions/read-dev-facts.function";
import type { RunwayFacts } from "#core/types/runway-facts.type";
import { PUBLIC_VAR_PREFIXES } from "#node/constants/public-var-prefixes.constant";
import { RUNWAY_FACTS_GLOBAL } from "#node/constants/runway-facts-global.constant";
import { readRunway } from "#node/functions/read-runway.function";
import { repositoryRoot } from "#node/functions/repository-root.function";
import { resolveVar } from "#node/functions/resolve-var.function";

/**
 * The `define` map of `member` in `environment`; every value is JSON text, as a bundler `define` expects.
 *
 * @param member - the member key; its runway is `./runway.yaml` (the generated config runs in the member root).
 * @param environment - a runway environment, usually `process.env.STACKRA_ENVIRONMENT ?? "dev"`.
 * @throws RangeError when `environment` is not a runway environment.
 * @throws RunwayInvalidError when a runway file breaks its schema.
 * @throws RunwayUnresolvedError when a var or the feed cannot be resolved for `environment`.
 * @example
 * stackra.viteConfig(app, { define: definesFor("console", process.env.STACKRA_ENVIRONMENT ?? "dev") });
 * // { "import.meta.env.VITE_SENTRY_DSN": "\"\"", __STACKRA_RUNWAY__: "{\"version\":1,…}" }
 */
export function definesFor(member: string, environment: string): Record<string, string> {
  const environments: readonly string[] = Enum.values(RunwayEnvironment);
  if (!environments.includes(environment)) {
    throw new RangeError(
      `"${environment}" is not a runway environment: expected one of ${environments.join(", ")}`,
    );
  }
  const target = environment as RunwayEnvironment;
  const file = join(process.cwd(), "runway.yaml");
  const runway = existsSync(file) ? readRunway(file, RunwayKind.App) : undefined;
  const values = runway?.environments[target];

  let devFacts: RunwayFacts | undefined;
  let isDevFactsRead = false;
  const readDev = (): RunwayFacts | undefined => {
    if (!isDevFactsRead) {
      devFacts = readDevFacts();
      isDevFactsRead = true;
    }
    return devFacts;
  };

  const defines: Record<string, string> = {};
  for (const [name, value] of Object.entries(values?.vars ?? {})) {
    if (!PUBLIC_VAR_PREFIXES.some((prefix) => name.startsWith(prefix))) continue;
    defines[`import.meta.env.${name}`] = JSON.stringify(
      resolveVar(name, value, member, target, readDev),
    );
  }

  if (target === RunwayEnvironment.Dev) {
    const facts = readDev();
    const entry =
      facts !== undefined && Object.hasOwn(facts.members, member)
        ? facts.members[member]
        : undefined;
    if (facts !== undefined && entry !== undefined) {
      // `tls` is left out: its paths name files on this machine and never reach a bundle
      const { url, port, host, https, open, desktop, feed } = entry;
      defines[RUNWAY_FACTS_GLOBAL] = JSON.stringify({
        version: 1,
        environment: target,
        lane: facts.lane,
        feedOrigin: facts.feedOrigin,
        members: { [member]: { url, port, host, https, open, desktop, feed } },
      });
    }
    return defines;
  }

  const feedPath = runway?.release?.desktop?.feedPath;
  const channel = values?.desktop?.channel;
  let feedOrigin: string | undefined;
  if (feedPath !== undefined && channel !== undefined) {
    const root = readRunway(join(repositoryRoot(), "runway.yaml"), RunwayKind.Root);
    feedOrigin = root.targets?.["electron-release"]?.feed?.publicOrigin;
    if (feedOrigin === undefined) {
      throw new RunwayUnresolvedError(
        `"${member}" has the desktop channel "${channel}" in ${target}, but the root runway has no ` +
          "targets.electron-release.feed.publicOrigin",
      );
    }
  }
  defines[RUNWAY_FACTS_GLOBAL] = JSON.stringify({
    version: 1,
    environment: target,
    feedOrigin,
    members: {
      [member]:
        feedPath !== undefined && channel !== undefined
          ? { feed: { path: feedPath, channel } }
          : {},
    },
  });
  return defines;
}
