/**
 * Stackra file contract:
 * Purpose: `readServiceManifests`, the committed `stackra.manifest.json` of each service the member injects a
 *          generated client of, found in the folder beside the member (`services/<service>` next to
 *          `services/<member>`), or for an app in the repo's `services/` (`apps/<app>` reads `services/<service>`), by the service key or its kebab-case folder name, the manifest's member matched in snake or kebab case (STA-1296): what the clients target writes
 *          `#stackra/clients/<service>` from, with the folder it sits in (where the events target imports its topics).
 *          When no sibling folder matches, a declared dependency that is a `contract` package (`stackra.kind`) whose
 *          manifest `member` is the service supplies it, with no folder and its package name (STA-1820); a service is
 *          never matched to any other dependency by name.
 * Boundary: reads files only. A service is matched by the manifest's `member`, never by importing its package
 *           (ADR 0010: services never import each other). A service with no manifest is left out, and the clients
 *           target refuses it with its fix. A manifest that is not valid JSON fails the run.
 * Runtime: node
 * Governing contract: ADR 0260 (decisions 1 to 3: one contract source, one generated client per service); ADR 0158; STA-1293 (clients for apps).
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

import type { StackraManifest } from "@stackra/contracts";
import { kebabCase } from "@stackra/support";

import type { MemberIR } from "#core/types/member-ir.type";
import { dependencyPath } from "#node/functions/dependency-path.function";
import { isContractPackage } from "#node/functions/is-contract-package.function";

/**
 * The manifests of `services`, sorted by service key.
 *
 * @param root - the member root.
 * @param services - the service keys the member imports a client of.
 * @param dependencies - the member's declared dependency names, searched for contract packages.
 * @throws Error when a manifest is not valid JSON.
 * @example
 * readServiceManifests("/repo/services/channels", ["catalogue"])[0]?.manifest.package;
 */
export function readServiceManifests(
  root: string,
  services: readonly string[],
  dependencies: readonly string[] = [],
): NonNullable<MemberIR["services"]> {
  const found: NonNullable<MemberIR["services"]>[number][] = [];
  // Beside the member first; an app (`apps/<app>`) also looks in the repo's `services/`.
  const parents = [...new Set([dirname(root), join(dirname(dirname(root)), "services")])];
  // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
  for (const service of [...new Set(services)].sort()) {
    const before = found.length;
    search: for (const parent of parents)
      for (const folder of new Set([service, kebabCase(service)])) {
        const path = join(parent, folder, "stackra.manifest.json");
        if (!existsSync(path)) continue;
        let manifest: StackraManifest;
        try {
          manifest = JSON.parse(readFileSync(path, "utf8")) as StackraManifest;
        } catch (error) {
          throw new Error(`${path} is not valid JSON: ${(error as Error).message}`, {
            cause: error,
          });
        }
        // The manifest's member is snake case (`compliance_privacy`); the specifier may be kebab (`compliance-privacy`).
        if (kebabCase(manifest.member) !== kebabCase(service)) continue;
        found.push({ member: service, folder, manifest });
        break search;
      }
    if (found.length > before) continue;
    // No sibling folder: a contract package of the service, matched by kind and manifest member.
    for (const dependency of dependencies) {
      const path = isContractPackage(root, dependency)
        ? dependencyPath(root, dependency, "stackra.manifest.json")
        : undefined;
      if (path === undefined) continue;
      let manifest: StackraManifest;
      try {
        manifest = JSON.parse(readFileSync(path, "utf8")) as StackraManifest;
      } catch (error) {
        throw new Error(`${path} is not valid JSON: ${(error as Error).message}`, { cause: error });
      }
      if (kebabCase(manifest.member) !== kebabCase(service)) continue;
      found.push({ member: service, package: dependency, manifest });
      break;
    }
  }
  return found;
}
