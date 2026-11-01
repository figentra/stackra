/**
 * Stackra file contract:
 * Purpose: `inspectConsumerGateLeaks(root, core)`, the leak check of a pack-mode install: for each package under
 *          `<root>/node_modules/@stackra`, the realpath of the package and of each of its top-level entries, and the
 *          `@stackra/source` targets of its `exports` that are absent from the installed files, judged by
 *          `judgeConsumerGateLeak`.
 * Boundary: reads under `<root>/node_modules/@stackra` only; writes nothing. Shortcut: it resolves the package
 *           folder and its top-level entries, not every nested file; a symlink below the top level is not followed.
 * Runtime: node
 * Governing contract: ADR 0500 (decision 3); STA-1813.
 */
import { existsSync, readdirSync, readFileSync, realpathSync } from "node:fs";
import { join } from "node:path";

import { collectSourceTargets } from "#node/consumer-gate/functions/collect-source-targets.function";
import { judgeConsumerGateLeak } from "#node/consumer-gate/functions/judge-consumer-gate-leak.function";

/**
 * Inspects the installed `@stackra/*` packages.
 *
 * @param root - the scratch copy root.
 * @param core - the core tree root.
 * @example
 * inspectConsumerGateLeaks("/out/work/pay", "/core"); // [] when nothing leaks
 */
export function inspectConsumerGateLeaks(root: string, core: string): string[] {
  const scope = join(root, "node_modules", "@stackra");
  if (!existsSync(scope)) return ["no @stackra packages are installed"];
  const realCore = realpathSync(core);
  const resolved: string[] = [];
  const missingSources: string[] = [];
  for (const name of readdirSync(scope)) {
    const dir = realpathSync(join(scope, name));
    resolved.push(dir, ...readdirSync(dir).map((entry) => realpathSync(join(dir, entry))));
    const manifest = join(dir, "package.json");
    if (!existsSync(manifest)) continue;
    const { exports } = JSON.parse(readFileSync(manifest, "utf8")) as { exports?: unknown };
    for (const target of collectSourceTargets(exports)) {
      if (target.startsWith("./src/") && !existsSync(join(dir, target))) {
        missingSources.push(`@stackra/${name} ${target}`);
      }
    }
  }
  return judgeConsumerGateLeak({ core: realCore, resolved, missingSources });
}
