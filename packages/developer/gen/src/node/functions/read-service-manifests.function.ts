/**
 * Stackra file contract:
 * Purpose: `readServiceManifests`, the committed `stackra.manifest.json` of each service the member injects a
 *          generated client of, found in the folder beside the member (`services/<service>` next to
 *          `services/<member>`), or for an app in the repo's `services/` (`apps/<app>` reads `services/<service>`), by the service key or its kebab-case folder name, the manifest's member matched in snake or kebab case (STA-1296): what the clients target writes
 *          `#stackra/clients/<service>` from, with the folder it sits in (where the events target imports its topics).
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

/**
 * The manifests of `services`, sorted by service key.
 *
 * @param root - the member root.
 * @param services - the service keys the member imports a client of.
 * @throws Error when a manifest is not valid JSON.
 * @example
 * readServiceManifests("/repo/services/channels", ["catalogue"])[0]?.manifest.package;
 */
export function readServiceManifests(
  root: string,
  services: readonly string[],
): NonNullable<MemberIR["services"]> {
  const found: { member: string; folder: string; manifest: StackraManifest }[] = [];
  // Beside the member first; an app (`apps/<app>`) also looks in the repo's `services/`.
  const parents = [...new Set([dirname(root), join(dirname(dirname(root)), "services")])];
  for (const service of [...new Set(services)].sort()) {
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
  }
  return found;
}
