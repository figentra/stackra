/**
 * Stackra file contract:
 * Purpose: `APP_NATIVE_DEPS_COMMAND`, `stackra app-native-deps`: the Expo native-dependency check of `pnpm validate` on
 *          its own. Prints each finding as `<dir>: <finding>` and exits 1, or prints nothing and exits 0 (was
 *          `tools/scripts/app-native-deps.mjs`).
 * Boundary: reads the workspace manifests; writes nothing.
 * Runtime: node
 * Governing contract: ADR 0117; STA-1544; ADR 0282 (decision 3).
 */
import { appNativeDependencyFindings } from "#node/app-native-deps/functions/app-native-dependency-findings.function";
import { workspaceRoot } from "#node/functions/workspace-root.function";
import type { CliCommand } from "#node/types/cli-command.type";

/** The `stackra app-native-deps` command. */
export const APP_NATIVE_DEPS_COMMAND: CliCommand = {
  name: "app-native-deps",
  summary:
    "Fail when an Expo app lacks a native library a package in its dependency closure declares",
  usage: "stackra app-native-deps",
  async run({ cwd, io }) {
    const findings = appNativeDependencyFindings(workspaceRoot(cwd));
    for (const { dir, text } of findings) io.err(`${dir}: ${text}\n`);
    return findings.length > 0 ? 1 : 0;
  },
};
