#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: the app native-dependency check of `pnpm validate` (STA-1544): every Expo app member (`apps/*` depending on `expo`) must declare in
 *          its own `dependencies` each native library (a name starting with one of NATIVE_PREFIXES) that a workspace
 *          package in its dependency closure declares. The closure follows `dependencies` and `peerDependencies` of
 *          the app and, recursively, of every workspace member reached. Expo autolinks only the app's own
 *          dependencies, so a library missing there passes every build and crashes at launch with "Cannot find
 *          native module". Each finding names the missing library and the package that needs it.
 * Boundary: reads pnpm-workspace.yaml and each member's package.json (through package-cycles.mjs); writes nothing.
 *           Run directly it prints the findings and exits 1, or prints nothing and exits 0.
 * Runtime: node
 * Governing contract: ADR 0117; STA-1544.
 * Scope: every workspace member under `apps/` that depends on `expo` (a web app autolinks nothing).
 * Owner: release-operations · Secrets: forbidden
 */
import { fileURLToPath } from "node:url";

import { readWorkspaceMembers } from "./package-cycles.mjs";

// oxlint-disable stackra/one-declaration-per-file -- reason: a plain-node script module run by pnpm validate, not member source (like package-cycles.mjs); its tests import these names

/** Name prefixes of the libraries Expo autolinks (native code that must sit in the app's own dependencies). */
export const NATIVE_PREFIXES = Object.freeze([
  "expo-",
  "react-native-",
  "@react-native",
  "@expo/ui",
  "@shopify/react-native",
]);

/** Whether `name` is a native library by NATIVE_PREFIXES. */
export const isNativeLibrary = (name) => NATIVE_PREFIXES.some((prefix) => name.startsWith(prefix));

/** The dependency and peer dependency names of one manifest. */
const declared = (manifest) => [
  ...Object.keys(manifest.dependencies ?? {}),
  ...Object.keys(manifest.peerDependencies ?? {}),
];

/**
 * The validate findings (`{ dir, text }`): one per app and native library a workspace package in the app's closure
 * declares but the app's own `dependencies` lack.
 *
 * @example
 * appNativeDependencyFindings(root); // [{ dir: "apps/mobile", text: "missing native dependency expo-widgets (needed by @stackra/widgets) ..." }]
 */
export function appNativeDependencyFindings(root) {
  const members = readWorkspaceMembers(root);
  const byName = new Map(members.map((member) => [member.name, member]));
  const findings = [];
  // Only an Expo app autolinks; a web app (apps/playground, apps/console) bundles no native module.
  const apps = members.filter(
    (member) => member.dir.startsWith("apps/") && member.manifest.dependencies?.expo !== undefined,
  );
  for (const app of apps) {
    const own = new Set(Object.keys(app.manifest.dependencies ?? {}));
    const needed = new Map();
    const seen = new Set([app.name]);
    const queue = declared(app.manifest).filter((name) => byName.has(name));
    while (queue.length) {
      const name = queue.shift();
      if (seen.has(name)) continue;
      seen.add(name);
      for (const dep of declared(byName.get(name).manifest)) {
        if (byName.has(dep)) queue.push(dep);
        else if (isNativeLibrary(dep) && !own.has(dep)) {
          needed.set(dep, [...(needed.get(dep) ?? []), name]);
        }
      }
    }
    for (const [library, packages] of [...needed].toSorted(([a], [b]) => (a < b ? -1 : 1))) {
      findings.push({
        dir: app.dir,
        text: `missing native dependency ${library} (needed by ${packages.toSorted().join(", ")}): Expo autolinks only the app's own dependencies, so it crashes at launch with "Cannot find native module"`,
      });
    }
  }
  return findings;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const findings = appNativeDependencyFindings(fileURLToPath(new URL("../../", import.meta.url)));
  for (const { dir, text } of findings) console.error(`${dir}: ${text}`);
  if (findings.length) process.exit(1);
}
