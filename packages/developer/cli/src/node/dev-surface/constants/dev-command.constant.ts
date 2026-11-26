/**
 * Stackra file contract:
 * Purpose: `DEV_COMMAND`, `stackra dev`: the member tool command (`toolCommand("dev")`, unchanged) plus the surface
 *          mode `stackra dev --surface <surface> [--os <checkout>] [--shell <version>] [--shell-origin <url>]
 *          [--api <url>]`, which runs a product surface in its real shell (`runDevSurface`), the mobile mode
 *          `stackra dev --mobile <app> --os <checkout> [--device <udid>]` (`runDevMobile`), and `stackra dev --product
 *          --os <checkout>`, every surface and mobile app of the root runway at once (`runDevProduct`). Any mode takes
 *          `--tunnel`: the developer machine's Cloudflare Tunnel runs beside it and stops with it (`startTunnel`).
 *          The member mode runs the quick doctor first (`devReady`) and stops early when the machine is not ready, then
 *          writes `.stackra/dev/ports.json` (`writeDevFacts`, the lane from the root runway: `devLane`) before the tool
 *          starts. At the root of a product with service members (`services/<key>` with a `stackra.config.ts` or a
 *          generated `encore.app`) it runs the whole product instead (`runDevRoot`): one `encore run` of every service,
 *          member ports forwarded to the gateway, migrations and seeders (`--seed <profile>|none`), and the other
 *          members and Workers through turbo.
 * Boundary: data plus dispatch; a surface flag without `--surface` is a usage error, never ignored.
 * Runtime: node
 * Governing contract: ADR 0436 (decision 6); app-shells section 15 point 2; ADR 0282 (decision 3); ADR 0290
 *                     (decisions 4 and 5); STA-1952 spec FR-019; ADR 0296 (decisions 1 and 3); STA-2840.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { devLane } from "@stackra/runway";
import { writeDevFacts } from "@stackra/runway/node";
import { parse } from "yaml";

import { runDevMobile } from "#node/dev-mobile/functions/run-dev-mobile.function";
import { runDevProduct } from "#node/dev-product/functions/run-dev-product.function";
import { runDevRoot } from "#node/dev-root/functions/run-dev-root.function";
import { runDevSurface } from "#node/dev-surface/functions/run-dev-surface.function";
import { startTunnel } from "#node/dev-tunnel/functions/start-tunnel.function";
import { devReady } from "#node/doctor/functions/dev-ready.function";
import { CliUsageError } from "#node/errors/cli-usage.error";
import { workspaceRoot } from "#node/functions/workspace-root.function";
import { toolCommand } from "#node/functions/tool-command.function";
import type { CliCommand } from "#node/types/cli-command.type";
import type { CliContext } from "#node/types/cli-context.type";

/** The member tool command `dev` the surface mode extends. */
const MEMBER_DEV = toolCommand(
  "dev",
  "Generate, then serve the member (--target picks an app target)",
);

/** The flags only the surface mode takes. */
const SURFACE_FLAGS = ["os", "shell", "shell-origin", "api", "device"] as const;

/** Whether `cwd` is a product root with service members: root `stackra dev` then runs them as one Encore app. */
function productWithServices(cwd: string): boolean {
  if (!existsSync(join(cwd, "pnpm-workspace.yaml")) || !existsSync(join(cwd, "runway.yaml")))
    return false;
  const services = join(cwd, "services");
  return (
    existsSync(services) &&
    readdirSync(services, { withFileTypes: true }).some(
      (entry) =>
        entry.isDirectory() &&
        (existsSync(join(services, entry.name, "stackra.config.ts")) ||
          existsSync(join(services, entry.name, "encore.app"))),
    )
  );
}

/** Runs the mode the flags pick. */
async function runMode(context: CliContext): Promise<number> {
  if (context.values["product"] === true) return runDevProduct(context);
  if (context.values["mobile"] !== undefined) return runDevMobile(context);
  if (context.values["surface"] !== undefined) return runDevSurface(context);
  const stray = SURFACE_FLAGS.find((flag) => context.values[flag] !== undefined);
  if (stray !== undefined)
    throw new CliUsageError(`--${stray} needs --surface <surface>, --mobile <app> or --product`);
  if (context.values["seed"] !== undefined && !productWithServices(context.cwd))
    throw new CliUsageError("--seed runs at the root of a product with service members");
  // The root runway picks the lane (STACKRA_LANE, else its row of `lanes.repos`); the doctor checks that lane's ports.
  const root = workspaceRoot(context.cwd);
  const runway = join(root, "runway.yaml");
  const lane = existsSync(runway)
    ? devLane(parse(readFileSync(runway, "utf8")) ?? {}, process.env)
    : 0;
  if (!(await devReady(context.cwd, context.io, lane))) return 1;
  if (productWithServices(context.cwd)) return runDevRoot(context);
  // The member tool reads the facts (`devServer`, `devPorts`), so they exist before it starts.
  if (existsSync(runway)) writeDevFacts(root, lane);
  return MEMBER_DEV.run(context);
}

/** The `stackra dev` command definition. */
export const DEV_COMMAND: CliCommand = {
  ...MEMBER_DEV,
  summary:
    "Generate, then serve the member (--target picks an app target; --surface runs a product surface in its shell)",
  usage: `${MEMBER_DEV.usage}\n       stackra dev [--seed minimal|demo|test|none]   (at a product root with service members: one encore run of every service, then migrate and seed)\n       stackra dev --surface <surface> [--os <checkout>] [--shell <version>] [--shell-origin <url>] [--api <url>]\n       stackra dev --mobile <app> --os <checkout> [--device <udid>]\n       stackra dev --product --os <checkout> [--device <udid>]\n       any of these with --tunnel: this machine's Cloudflare Tunnel runs beside it (CLOUDFLARE_TUNNEL_TOKEN from the agents scope of figentra/secrets)`,
  options: {
    ...MEMBER_DEV.options,
    surface: { type: "string" },
    os: { type: "string" },
    shell: { type: "string" },
    "shell-origin": { type: "string" },
    api: { type: "string" },
    mobile: { type: "string" },
    product: { type: "boolean" },
    device: { type: "string" },
    tunnel: { type: "boolean" },
    seed: { type: "string" },
  },
  async run(context) {
    const tunnel =
      context.values["tunnel"] === true ? startTunnel(process.env, context.io) : undefined;
    try {
      return await runMode(context);
    } finally {
      tunnel?.stop();
    }
  },
};
