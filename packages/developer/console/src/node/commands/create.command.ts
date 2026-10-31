/**
 * Stackra file contract:
 * Purpose: `CreateCommand`, `stackra-console create <directory>` (the `laravel new` of Stackra): shows the banner,
 *          asks for the app name, binary and accent (or takes `--name`, `--bin`, `--accent`), refuses a folder that is
 *          not empty, writes a standalone console app, and installs it unless `--no-install`.
 * Boundary: writes only inside `<directory>`; runs the package manager there. `--tarballs <dir>` installs the
 *           `@stackra/*` packages from packed tarballs (verification before a release). Never writes a token.
 * Runtime: node
 * Governing contract: STA-1730 spec FR-029 to FR-031.
 */
import { execFile } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { promisify } from "node:util";

import { Str } from "@stackra/validation";

import { Command } from "#core/bases/command.base";
import { Argument } from "#core/decorators/argument.decorator";
import { Option } from "#core/decorators/option.decorator";
import type { CommandIo } from "#core/types/command-io.type";
import { appFiles } from "#node/functions/app-files.function";
import { ownVersion } from "#node/functions/own-version.function";
import { tarballSpecs } from "#node/functions/tarball-specs.function";

/** A `#rrggbb` colour. */
const HEX = /^#[0-9a-fA-F]{6}$/;

/** A package or binary name. */
const NAME = /^(?:@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;

/** Why a name is refused, or undefined. */
const validName = (value: string) =>
  NAME.test(value) ? undefined : "Use lower-case letters, digits and dashes";

/** Creates a new console app. */
export class CreateCommand extends Command({
  name: "create",
  description: "Create a new console app",
}) {
  /** Where to create it. */
  @Argument({ description: "The folder to create the app in" })
  directory!: string;

  /** The package name. */
  @Option({ description: "The app's package name" })
  @Str({ pattern: NAME })
  name?: string;

  /** The binary name. */
  @Option({ description: "The command people type" })
  @Str({ pattern: NAME })
  bin?: string;

  /** The theme accent. */
  @Option({ description: "The accent colour, #rrggbb" })
  @Str({ pattern: HEX })
  accent?: string;

  /** Install the dependencies (`--no-install` skips it). */
  @Option({ description: "Install the dependencies (--no-install to skip)" })
  install = true;

  /** The package manager. */
  @Option({ description: "pnpm or npm" })
  @Str({ pattern: /^(pnpm|npm)$/ })
  pm = "pnpm";

  /** A folder of packed `@stackra/*` tarballs to install from. */
  @Option({ description: "Install @stackra packages from the tarballs in this folder" })
  @Str
  tarballs?: string;

  /** Writes the app and returns where it went. */
  async handle(io: CommandIo): Promise<Readonly<Record<string, unknown>>> {
    io.output.banner();
    const directory = resolve(this.directory);
    if (existsSync(directory) && readdirSync(directory).length > 0)
      throw new Error(`${directory} exists and is not empty; choose a new folder`);
    const fallbackName = basename(directory)
      .toLowerCase()
      .replaceAll(/[^a-z0-9-]+/g, "-");
    const name =
      this.name ??
      (await io.prompt.text({
        message: "What is the app called?",
        default: fallbackName,
        validate: validName,
        option: "name",
      }));
    const bin =
      this.bin ??
      (await io.prompt.text({
        message: "What do people type to run it?",
        default: name.replace(/^@.*\//, ""),
        validate: validName,
        option: "bin",
      }));
    const accent =
      this.accent ??
      (await io.prompt.text({
        message: "Which accent colour?",
        default: "#647384",
        validate: (value) => (HEX.test(value) ? undefined : "Use #rrggbb"),
        option: "accent",
      }));
    const tarballs = this.tarballs === undefined ? {} : tarballSpecs(resolve(this.tarballs));
    const version = ownVersion();
    const files = appFiles({
      name,
      bin,
      accent,
      stackra: { "@stackra/console": version, "@stackra/validation": version, ...tarballs },
      override: this.tarballs !== undefined,
    });
    await io.output.task("Writing the app", () => {
      for (const [path, text] of Object.entries(files)) {
        const target = join(directory, path);
        mkdirSync(dirname(target), { recursive: true });
        writeFileSync(target, text);
      }
    });
    if (this.install)
      await io.output.task(`Installing with ${this.pm}`, () =>
        promisify(execFile)(this.pm, ["install"], { cwd: directory, maxBuffer: 16 * 1024 * 1024 }),
      );
    io.output.note(
      [
        `cd ${this.directory}`,
        ...(this.install ? [] : [`${this.pm} install`]),
        `${this.pm} run build`,
        `node dist/main.js greet`,
      ].join("\n"),
      "info",
      "Next",
    );
    return { directory, name, bin, files: Object.keys(files) };
  }
}
