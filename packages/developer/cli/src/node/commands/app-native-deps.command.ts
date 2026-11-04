/**
 * Stackra file contract:
 * Purpose: `AppNativeDepsCommand`, `stackra app-native-deps`: the Expo native-dependency check of `pnpm validate` on
 *          its own. Each finding is a failed checklist row (the findings are the `--json` data) and any finding exits 1
 *          (was `tools/scripts/app-native-deps.mjs`).
 * Boundary: reads the workspace manifests; writes nothing.
 * Runtime: node
 * Governing contract: ADR 0117; STA-1544; ADR 0282 (decision 3); ADR 0506; STA-1966.
 */
import { Command, type CommandIo } from "@stackra/console";

import { appNativeDependencyFindings } from "#node/app-native-deps/functions/app-native-dependency-findings.function";
import { reportFindings } from "#node/functions/report-findings.function";
import { workspaceRoot } from "#node/functions/workspace-root.function";

/** Fails when an Expo app lacks a native library its dependency closure declares. */
export class AppNativeDepsCommand extends Command({
  name: "app-native-deps",
  description:
    "Fail when an Expo app lacks a native library a package in its dependency closure declares",
  bin: true,
}) {
  /** Reports the missing native libraries. */
  async handle(io: CommandIo): Promise<number> {
    return reportFindings(
      io,
      appNativeDependencyFindings(workspaceRoot(io.cwd)),
      "every Expo app declares the native libraries its packages need",
    );
  }
}
