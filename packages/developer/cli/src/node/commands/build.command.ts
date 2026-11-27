/**
 * Stackra file contract:
 * Purpose: `BuildCommand`, `stackra build`: generates, then builds the member (tsdown for a package, the app's build
 *          for an app; a service is built by Encore at deploy), or with `--product` runs `stackra gen` and builds a
 *          product's surfaces and mobile apps. The body is `BUILD_COMMAND`, unchanged.
 * Boundary: parses nothing itself; a product flag without `--product` is refused by the body (exit 2).
 * Runtime: node
 * Governing contract: ADR 0482; ADR 0282 (decision 3); ADR 0506; ADR 0500 (decision 7); STA-1676; STA-2883.
 */
import { Command, Option, type CommandIo } from "@stackra/console";
import { Str } from "@stackra/validation";

import { runBody } from "#node/functions/run-body.function";
import { BUILD_COMMAND } from "#node/product/constants/build-command.constant";
import type { CliCommand } from "#node/types/cli-command.type";

/** Builds the member or the product. */
export class BuildCommand extends Command({
  name: "build",
  description: BUILD_COMMAND.summary,
  group: "Develop",
  bin: true,
  examples: ["stackra build", "stackra build --product --dry-run --os ../template"],
}) {
  /** The body it runs, unchanged; every option the body reads is a field here. */
  static readonly body: CliCommand = BUILD_COMMAND;

  /** One of an app's targets. */
  @Option({ description: "The app target to build (an app with several)" })
  @Str
  target?: string;

  /** Build the product. */
  @Option({ description: "Build the product's surfaces and mobile apps (after `stackra gen`)" })
  product = false;

  /** Show the plan and build nothing. */
  @Option({ description: "With --product: show what would be built, build nothing" })
  dryRun = false;

  /** Build the web surfaces alone. */
  @Option({ description: "With --product: build the web surfaces, not the mobile apps" })
  surfacesOnly = false;

  /** The template checkout. */
  @Option({ description: "With --product: the template checkout the shells come from" })
  @Str
  os?: string;

  /** The npm scope. */
  @Option({ description: "With --product: the product's npm scope, @kebab" })
  @Str
  scope?: string;

  /** The environment it builds for. */
  @Option({ description: "With --product: the environment the build is for" })
  @Str
  env?: string;

  /** Builds; the exit code is the build's. */
  handle(io: CommandIo): Promise<number> {
    return runBody(io, BUILD_COMMAND, {
      values: {
        target: this.target,
        product: this.product,
        "dry-run": this.dryRun,
        "surfaces-only": this.surfacesOnly,
        os: this.os,
        scope: this.scope,
        env: this.env,
      },
    });
  }
}
