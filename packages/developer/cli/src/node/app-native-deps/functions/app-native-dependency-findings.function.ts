/**
 * Stackra file contract:
 * Purpose: `appNativeDependencyFindings(root)`, the Expo native-dependency findings (STA-1544): every Expo app member
 *          (`apps/*` depending on `expo`) must declare in its own `dependencies` each native library that a workspace
 *          package in its dependency closure (dependencies and peerDependencies, followed recursively) declares. Expo
 *          autolinks only the app's own dependencies, so a missing one crashes at launch with "Cannot find native
 *          module" (moved from `tools/scripts/app-native-deps.mjs`).
 * Boundary: reads pnpm-workspace.yaml and each member's package.json; writes nothing.
 * Runtime: node
 * Governing contract: ADR 0117; STA-1544.
 */
import type { PackageManifest } from "@stackra/repo-checks/node";

import { isNativeLibrary } from "#node/app-native-deps/functions/is-native-library.function";
import { readManifestMembers } from "#node/functions/read-workspace-members.function";
import { sorted } from "#node/functions/sorted.function";
import type { DirFinding } from "#node/types/dir-finding.type";
import type { ManifestMember } from "#node/types/manifest-member.type";

/** The dependency and peer dependency names of one manifest. */
const declared = (manifest: PackageManifest): string[] => [
  ...Object.keys(manifest.dependencies ?? {}),
  ...Object.keys(manifest.peerDependencies ?? {}),
];

/**
 * One finding per app and native library a workspace package in the app's closure declares but the app lacks.
 *
 * @param root - the workspace root.
 * @example
 * appNativeDependencyFindings(root); // [{ dir: "apps/mobile", text: "missing native dependency expo-widgets (needed by @stackra/widgets) ..." }]
 */
export function appNativeDependencyFindings(root: string): DirFinding[] {
  const members = readManifestMembers(root);
  const byName = new Map<string, ManifestMember>(members.map((member) => [member.name, member]));
  const findings: DirFinding[] = [];
  // Only an Expo app autolinks; a web app (apps/playground, apps/console) bundles no native module.
  const apps = members.filter(
    (member) =>
      member.dir.startsWith("apps/") && member.manifest.dependencies?.["expo"] !== undefined,
  );
  for (const app of apps) {
    const own = new Set(Object.keys(app.manifest.dependencies ?? {}));
    const needed = new Map<string, string[]>();
    const seen = new Set([app.name]);
    const queue = declared(app.manifest).filter((name) => byName.has(name));
    while (queue.length > 0) {
      const name = queue.shift() ?? "";
      if (seen.has(name)) continue;
      seen.add(name);
      for (const dep of declared(byName.get(name)?.manifest ?? {})) {
        if (byName.has(dep)) queue.push(dep);
        else if (isNativeLibrary(dep) && !own.has(dep)) {
          needed.set(dep, [...(needed.get(dep) ?? []), name]);
        }
      }
    }
    for (const [library, packages] of sorted(needed, ([a], [b]) => (a < b ? -1 : 1))) {
      findings.push({
        dir: app.dir,
        text: `missing native dependency ${library} (needed by ${sorted(packages).join(", ")}): Expo autolinks only the app's own dependencies, so it crashes at launch with "Cannot find native module"`,
      });
    }
  }
  return findings;
}
