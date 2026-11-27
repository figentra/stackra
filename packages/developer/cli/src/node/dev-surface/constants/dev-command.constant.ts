/**
 * Stackra file contract:
 * Purpose: `DEV_COMMAND`, `stackra dev`: the member tool command (`toolCommand("dev")`, unchanged) plus the surface
 *          mode `stackra dev --surface <surface> [--os <checkout>] [--shell <version>] [--shell-origin <url>]
 *          [--api <url>]`, which runs a product surface in its real shell (`runDevSurface`), the mobile mode
 *          `stackra dev --mobile <app> --os <checkout> [--device <udid>]` (`runDevMobile`), and `stackra dev --product
 *          --os <checkout>`, every surface and mobile app of the root runway at once (`runDevProduct`). Any mode takes
 *          `--tunnel`: the developer machine's Cloudflare Tunnel runs beside it and stops with it (`startTunnel`).
 *          The member mode runs the quick doctor first (`devReady`) and stops early when the machine is not ready, then
 *          writes `.stackra/dev/ports.json` (`writeDevFacts`, lane from `STACKRA_LANE`) and starts the dev compose of
 *          the root runway's `environments.dev.infra` (`startDevInfra`: Valkey, SeaweedFS, Mailpit, ClamAV, …; `--infra
 *          <name>[,<name>]` adds `when: opt-in` blocks, `--no-infra` skips it) before the tool starts.
 * Boundary: data plus dispatch; a surface flag without `--surface` is a usage error, never ignored, and so is an infra
 *           flag in the surface, mobile or product mode. A member run that turbo started from the root run
 *           (`TURBO_HASH` set) leaves the dev compose to that outer run, so the members never race to start it.
 * Runtime: node
 * Governing contract: ADR 0436 (decision 6); app-shells section 15 point 2; ADR 0282 (decision 3); ADR 0290
 *                     (decisions 4 and 5); STA-1952 spec FR-019; ADR 0199 (decision 3); STA-2664 (item 6).
 */
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";

import { writeDevFacts } from "@stackra/runway/node";

import { DEV_INFRA_FILES } from "#node/dev-infra/constants/dev-infra-files.constant";
import { startDevInfra } from "#node/dev-infra/functions/start-dev-infra.function";
import { runDevMobile } from "#node/dev-mobile/functions/run-dev-mobile.function";
import { runDevProduct } from "#node/dev-product/functions/run-dev-product.function";
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

/** The flags only the member mode takes. */
const INFRA_FLAGS = ["infra", "no-infra"] as const;

/**
 * Starts the dev compose for a member or root run, unless `--no-infra` or a turbo-started member run.
 *
 * @returns the exit code; 0 when there is nothing to start.
 */
async function devInfra(context: CliContext, root: string, lane: number): Promise<number> {
  if (context.values["no-infra"] === true) {
    // The members' runs then get no container variables either.
    rmSync(join(root, DEV_INFRA_FILES.state), { force: true });
    return 0;
  }
  // A member run turbo started from the root run: that outer run started the containers already.
  if (process.env["TURBO_HASH"] !== undefined) return 0;
  const raw = context.values["infra"];
  const optIn =
    typeof raw === "string"
      ? raw
          .split(",")
          .map((name) => name.trim())
          .filter((name) => name !== "")
      : [];
  return startDevInfra(root, { lane, optIn }, context.io);
}

/** Runs the mode the flags pick. */
async function runMode(context: CliContext): Promise<number> {
  const mode = ["product", "mobile", "surface"].find((flag) => context.values[flag] !== undefined);
  const infraFlag = INFRA_FLAGS.find((flag) => context.values[flag] !== undefined);
  if (mode !== undefined && infraFlag !== undefined)
    throw new CliUsageError(`--${infraFlag} runs in the member mode only, not with --${mode}`);
  if (context.values["product"] === true) return runDevProduct(context);
  if (context.values["mobile"] !== undefined) return runDevMobile(context);
  if (context.values["surface"] !== undefined) return runDevSurface(context);
  const stray = SURFACE_FLAGS.find((flag) => context.values[flag] !== undefined);
  if (stray !== undefined)
    throw new CliUsageError(`--${stray} needs --surface <surface>, --mobile <app> or --product`);
  if (!(await devReady(context.cwd, context.io))) return 1;
  // The member tool reads the facts (`devServer`, `devPorts`), so they exist before it starts; STACKRA_LANE picks the lane.
  const root = workspaceRoot(context.cwd);
  if (existsSync(join(root, "runway.yaml"))) {
    const lane = Number(process.env["STACKRA_LANE"] ?? 0);
    writeDevFacts(root, lane);
    const code = await devInfra(context, root, lane);
    if (code !== 0) return code;
  }
  return MEMBER_DEV.run(context);
}

/** The `stackra dev` command definition. */
export const DEV_COMMAND: CliCommand = {
  ...MEMBER_DEV,
  summary:
    "Generate, then serve the member (--target picks an app target; --surface runs a product surface in its shell)",
  usage: `${MEMBER_DEV.usage} [--infra <name>[,<name>]] [--no-infra]\n       stackra dev --surface <surface> [--os <checkout>] [--shell <version>] [--shell-origin <url>] [--api <url>]\n       stackra dev --mobile <app> --os <checkout> [--device <udid>]\n       stackra dev --product --os <checkout> [--device <udid>]\n       any of these with --tunnel: this machine's Cloudflare Tunnel runs beside it (CLOUDFLARE_TUNNEL_TOKEN in the environment, set for this run only)`,
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
    infra: { type: "string" },
    "no-infra": { type: "boolean" },
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
