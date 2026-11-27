/**
 * Stackra file contract:
 * Purpose: `PreviewServeCommand`, `stackra preview serve --surface <key>`: serves a built web surface on 127.0.0.1 as the
 *          edge would: the shell, the bundle and an API proxy. The body is `PREVIEW_SERVE_COMMAND`, unchanged.
 * Boundary: serves on the loopback only and reads the build output; writes nothing.
 * Runtime: node
 * Governing contract: ADR 0482; ADR 0282 (decision 3); ADR 0506; ADR 0500 (decision 7); STA-1676; STA-2883.
 */
import { Command, Option, type CommandIo } from "@stackra/console";
import { Str } from "@stackra/validation";

import { PREVIEW_SERVE_COMMAND } from "#node/product/constants/preview-serve-command.constant";
import { runBody } from "#node/functions/run-body.function";
import type { CliCommand } from "#node/types/cli-command.type";

/** Serves a built surface. */
export class PreviewServeCommand extends Command({
  name: "preview:serve",
  description: PREVIEW_SERVE_COMMAND.summary,
  group: "Deploy",
  bin: true,
  examples: ["stackra preview serve --surface console"],
}) {
  /** The body it runs, unchanged; every option the body reads is a field here. */
  static readonly body: CliCommand = PREVIEW_SERVE_COMMAND;

  /** The built web surface to serve, such as console */
  @Option({ description: "The built web surface to serve, such as console" })
  @Str
  surface?: string;

  /** The port on 127.0.0.1 (default: the surface's) */
  @Option({ description: "The port on 127.0.0.1 (default: the surface's)" })
  @Str
  port?: string;

  /** The API origin the proxy forwards to (default: the local services) */
  @Option({ description: "The API origin the proxy forwards to (default: the local services)" })
  @Str
  api?: string;

  /** The paths proxied to the API, comma-separated */
  @Option({ description: "The paths proxied to the API, comma-separated" })
  @Str
  apiPrefix?: string;

  /** The region the edge would serve from */
  @Option({ description: "The region the edge would serve from" })
  @Str
  region?: string;

  /** Serves until stopped; the exit code is the server's. */
  handle(io: CommandIo): Promise<number> {
    return runBody(io, PREVIEW_SERVE_COMMAND, {
      values: {
        surface: this.surface,
        port: this.port,
        api: this.api,
        "api-prefix": this.apiPrefix,
        region: this.region,
      },
    });
  }
}
