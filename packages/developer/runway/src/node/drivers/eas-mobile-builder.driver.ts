/**
 * Stackra file contract:
 * Purpose: `EasMobileBuilderDriver`, the EAS driver of the `MobileBuilder` port: writes the app's entry to
 *          `.stackra/mobile-app.json` in a checkout of the OS mobile template's line, where the template's app config
 *          and its capability config plugins read it, then starts `eas build` of the entry's channel for the platforms
 *          its identity names and answers the build ids.
 * Boundary: runs `eas` only, through the given `CommandRunner`, in the template folder; the EAS login is the job's
 *           `EXPO_TOKEN`, never an argument. The entry file holds public identity data only. Store submission and the
 *           listing from `assets/store` are the submit step's.
 * Runtime: node
 * Governing contract: ADR 0439 (decisions 1 to 3 and 8), ADR 0400 (decision 3: EAS through its CLI), ADR 0352
 *                     (decision 3).
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import { MobileBuilder } from "#core/ports/mobile-builder.port";
import type { MobileBuildRecord } from "#core/types/mobile-build-record.type";
import type { MobileBuildRequest } from "#core/types/mobile-build-request.type";
import { runCommand } from "#node/functions/run-command.function";
import type { CommandRunner } from "#node/types/command-runner.type";

/** Where the template's app config reads the entry, relative to the template folder. */
const ENTRY_FILE = ".stackra/mobile-app.json";

/** Writes one text file, creating its folder. */
type FileWriter = (path: string, text: string) => Promise<void>;

/** The real writer. */
const writeText: FileWriter = async (path, text) => {
  await mkdir(join(path, ".."), { recursive: true });
  await writeFile(path, text, "utf8");
};

/**
 * Builds mobile apps from the template on EAS.
 *
 * @example
 * const builder = new EasMobileBuilderDriver({ templateDir: "apps/mobile" });
 * await buildMobileApps(mobileBuildRequests(root, sha), builder, { platformPublishingCleared: false });
 */
export class EasMobileBuilderDriver extends MobileBuilder {
  private readonly templateDir: string;

  private readonly run: CommandRunner;

  private readonly write: FileWriter;

  /**
   * @param options.templateDir - the checkout of the template line, relative to the working folder.
   * @param options.run - the command runner; `runCommand` when absent.
   * @param options.write - the file writer; the real file system when absent.
   */
  constructor(options: {
    readonly templateDir: string;
    readonly run?: CommandRunner;
    readonly write?: FileWriter;
  }) {
    super();
    this.templateDir = options.templateDir;
    this.run = options.run ?? runCommand;
    this.write = options.write ?? writeText;
  }

  /** Writes the entry and starts the build. */
  override async build(request: MobileBuildRequest): Promise<MobileBuildRecord> {
    const { entry } = request;
    const source = `mobile build ${request.product}/${request.app}`;
    const channel = entry.eas.channel;
    if (channel === undefined)
      throw new RunwayInvalidError(source, [
        { path: "eas.channel", message: "Name the EAS channel and build profile" },
      ]);
    const ios = entry.identity.ios !== undefined;
    const android = entry.identity.android !== undefined;
    if (!ios && !android)
      throw new RunwayInvalidError(source, [
        { path: "identity", message: "Name an iOS bundle id, an Android package or both" },
      ]);
    const platform = ios && android ? "all" : ios ? "ios" : "android";
    await this.write(
      join(this.templateDir, ENTRY_FILE),
      `${JSON.stringify(
        {
          product: request.product,
          app: request.app,
          ...(request.tenant === undefined ? {} : { tenant: request.tenant }),
          entry,
        },
        null,
        2,
      )}\n`,
    );
    const out = await this.run(
      "eas",
      [
        "build",
        "--profile",
        channel,
        "--platform",
        platform,
        "--non-interactive",
        "--no-wait",
        "--json",
      ],
      { cwd: this.templateDir },
    );
    const value: unknown = JSON.parse(out);
    const builds = (Array.isArray(value) ? value : [value]) as Record<string, unknown>[];
    return { app: request.app, reference: builds.map((build) => String(build["id"])).join(",") };
  }
}
