/**
 * Stackra file contract:
 * Purpose: `renderLaunchConfig(inputs)`, Claude Code's `.claude/launch.json` from the runways: one configuration per
 *          web surface (`surface-<key>`: build the surfaces, then `stackra preview serve --surface <key>` on port 4173
 *          plus its place in `surfaces`) and one per member with a dev port (`<key>`, `worker-<key>` for a Worker: build
 *          what it imports, a Worker itself too, then its `dev` script). Each runs through `sh -c`, so a clean checkout
 *          (after `pnpm install`) starts it.
 * Boundary: pure. The port is the runway's; the member's `dev` script listens on it (gen passes no port to it). A
 *           surface keeps its port while new surfaces are added at the end of `surfaces`.
 * Runtime: node
 * Governing contract: ADR 0437 (decisions 2 and 3: `stackra preview serve`); ADR 0441 (decision 3); ADR 0296
 *                     (decision 1); ADR 0295 (amendment of 2026-11-03); STA-2081.
 */
import { PREVIEW_SERVE_SETTINGS } from "@stackra/runway/node";

import type { LaunchConfig } from "#node/launch-config/types/launch-config.type";
import type { LaunchConfiguration } from "#node/launch-config/types/launch-configuration.type";
import type { LaunchInputs } from "#node/launch-config/types/launch-inputs.type";

/** Turbo's build, quiet unless it fails. */
const BUILD = "pnpm turbo run build --output-logs=errors-only";

/** One server run through `sh -c`. */
const shell = (name: string, port: number, command: string): LaunchConfiguration => ({
  name,
  runtimeExecutable: "sh",
  runtimeArgs: ["-c", command],
  port,
});

/**
 * The launch file for `inputs`.
 *
 * @example
 * renderLaunchConfig({ surfaces: ["landing"], members: [], cli: "installed" }).configurations[0]?.port; // 4173
 */
export function renderLaunchConfig(inputs: LaunchInputs): LaunchConfig {
  // shortcut: surfaces serve a production build through the local edge; switch to `stackra dev --surface <key>` once gen
  // writes the bundle-mode Vite config without an OS checkout (ADR 0436 decision 6), keeping the name and port.
  const stackra =
    inputs.cli === "local"
      ? {
          setup: `${BUILD} --filter=@stackra/cli... && `,
          bin: "node packages/developer/cli/dist/stackra.mjs",
        }
      : { setup: "", bin: "pnpm exec stackra" };
  const surfaces = inputs.surfaces.map((key, index) => {
    const port = PREVIEW_SERVE_SETTINGS.port + index;
    return shell(
      `surface-${key}`,
      port,
      `${stackra.setup}${stackra.bin} build --product --surfaces-only && exec ${stackra.bin} preview serve --surface ${key} --port ${port}`,
    );
  });
  const members = inputs.members.map(({ key, name, port, worker }) =>
    // `wrangler dev` serves the Worker's own build output; every other dev server builds itself.
    shell(
      worker ? `worker-${key}` : key,
      port,
      `${BUILD} --filter=${name}${worker ? "..." : "^..."} && exec pnpm --filter ${name} run dev`,
    ),
  );
  // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
  members.sort((a, b) => a.name.localeCompare(b.name));
  return { version: "0.0.1", configurations: [...surfaces, ...members] };
}
