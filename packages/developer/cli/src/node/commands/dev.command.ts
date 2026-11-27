/**
 * Stackra file contract:
 * Purpose: `DevCommand`, `stackra dev`: serves the member (quick doctor first, then gen and its dev tool), or with
 *          `--surface`, `--mobile` or `--product` a product surface, a mobile app or every one of them against an OS
 *          checkout; `--tunnel` runs this machine's Cloudflare Tunnel beside it. The body is `DEV_COMMAND`, unchanged.
 * Boundary: parses nothing itself; a surface flag without its mode is refused by the body (exit 2).
 * Runtime: node
 * Governing contract: ADR 0436 (decision 6); ADR 0282 (decision 3); ADR 0290 (decisions 4 and 5); ADR 0506; ADR 0500
 *                     (decision 7); STA-1952 spec FR-019; STA-2883.
 */
import { Command, Option, type CommandIo } from "@stackra/console";
import { Str } from "@stackra/validation";

import { DEV_COMMAND } from "#node/dev-surface/constants/dev-command.constant";
import { runBody } from "#node/functions/run-body.function";
import type { CliCommand } from "#node/types/cli-command.type";

/** Serves the member, a surface, a mobile app or the whole product. */
export class DevCommand extends Command({
  name: "dev",
  description: DEV_COMMAND.summary,
  group: "Develop",
  bin: true,
  examples: [
    "stackra dev",
    "stackra dev --surface console --os ../template",
    "stackra dev --mobile field --os ../template --device <udid>",
    "stackra dev --product --os ../template --tunnel",
  ],
}) {
  /** The body it runs, unchanged; every option the body reads is a field here. */
  static readonly body: CliCommand = DEV_COMMAND;

  /** One of an app's targets. */
  @Option({ description: "The app target to serve (an app with several)" })
  @Str
  target?: string;

  /** A product surface. */
  @Option({ description: "Serve this product surface in its real shell (from the root runway)" })
  @Str
  surface?: string;

  /** A mobile app. */
  @Option({ description: "Run this mobile app of the root runway on a simulator" })
  @Str
  mobile?: string;

  /** Every surface and mobile app. */
  @Option({ description: "Run every surface and mobile app of the root runway at once" })
  product = false;

  /** The template checkout. */
  @Option({ description: "The template checkout the shells and app templates come from" })
  @Str
  os?: string;

  /** The shell version. */
  @Option({ description: "The shell version a surface runs in (default: the runway's)" })
  @Str
  shell?: string;

  /** Where the shell is served from. */
  @Option({ description: "Serve the shell from this origin instead of the checkout" })
  @Str
  shellOrigin?: string;

  /** The API origin. */
  @Option({ description: "The API origin a surface or app calls (default: the local services)" })
  @Str
  api?: string;

  /** The simulator to run on. */
  @Option({ description: "The simulator's udid (default: STACKRA_IOS_DEVICE)" })
  @Str
  device?: string;

  /** Run the tunnel beside it. */
  @Option({
    description: "Run this machine's Cloudflare Tunnel beside it; it stops with the command",
  })
  tunnel = false;

  /** Opt-in dev infra blocks. */
  @Option({
    description: "Also start these opt-in blocks of the dev compose (comma-separated names)",
  })
  @Str
  infra?: string;

  /** Skip the dev compose. */
  @Option({ description: "Start no dev compose (Valkey, SeaweedFS, Mailpit, …) for this run" })
  noInfra = false;

  /** Serves until the tool stops; the exit code is its own. */
  handle(io: CommandIo): Promise<number> {
    return runBody(io, DEV_COMMAND, {
      values: {
        target: this.target,
        surface: this.surface,
        mobile: this.mobile,
        product: this.product,
        os: this.os,
        shell: this.shell,
        "shell-origin": this.shellOrigin,
        api: this.api,
        device: this.device,
        tunnel: this.tunnel,
        infra: this.infra,
        "no-infra": this.noInfra,
      },
    });
  }
}
