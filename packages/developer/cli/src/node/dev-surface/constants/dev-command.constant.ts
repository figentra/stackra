/**
 * Stackra file contract:
 * Purpose: `DEV_COMMAND`, `stackra dev`: the member tool command (`toolCommand("dev")`, unchanged) plus the surface
 *          mode `stackra dev --surface <surface> [--os <checkout>] [--shell <version>] [--shell-origin <url>]
 *          [--api <url>]`, which runs a product surface in its real shell (`runDevSurface`), the mobile mode
 *          `stackra dev --mobile <app> --os <checkout> [--device <udid>]` (`runDevMobile`), and `stackra dev --product
 *          --os <checkout>`, every surface and mobile app of the root runway at once (`runDevProduct`). Any mode takes
 *          `--tunnel`: the developer machine's Cloudflare Tunnel runs beside it and stops with it (`startTunnel`).
 * Boundary: data plus dispatch; a surface flag without `--surface` is a usage error, never ignored.
 * Runtime: node
 * Governing contract: ADR 0436 (decision 6); app-shells section 15 point 2; ADR 0282 (decision 3); ADR 0290
 *                     (decisions 4 and 5).
 */
import { runDevMobile } from "#node/dev-mobile/functions/run-dev-mobile.function";
import { runDevProduct } from "#node/dev-product/functions/run-dev-product.function";
import { runDevSurface } from "#node/dev-surface/functions/run-dev-surface.function";
import { startTunnel } from "#node/dev-tunnel/functions/start-tunnel.function";
import { CliUsageError } from "#node/errors/cli-usage.error";
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

/** Runs the mode the flags pick. */
function runMode(context: CliContext): Promise<number> {
  if (context.values["product"] === true) return runDevProduct(context);
  if (context.values["mobile"] !== undefined) return runDevMobile(context);
  if (context.values["surface"] !== undefined) return runDevSurface(context);
  const stray = SURFACE_FLAGS.find((flag) => context.values[flag] !== undefined);
  if (stray !== undefined)
    throw new CliUsageError(`--${stray} needs --surface <surface>, --mobile <app> or --product`);
  return MEMBER_DEV.run(context);
}

/** The `stackra dev` command definition. */
export const DEV_COMMAND: CliCommand = {
  ...MEMBER_DEV,
  summary:
    "Generate, then serve the member (--target picks an app target; --surface runs a product surface in its shell)",
  usage: `${MEMBER_DEV.usage}\n       stackra dev --surface <surface> [--os <checkout>] [--shell <version>] [--shell-origin <url>] [--api <url>]\n       stackra dev --mobile <app> --os <checkout> [--device <udid>]\n       stackra dev --product --os <checkout> [--device <udid>]\n       any of these with --tunnel: this machine's Cloudflare Tunnel runs beside it (CLOUDFLARE_TUNNEL_TOKEN, through infisical run)`,
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
