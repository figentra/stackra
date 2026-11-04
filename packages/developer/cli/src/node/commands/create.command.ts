/**
 * Stackra file contract:
 * Purpose: `CreateCommand`, `stackra create <directory>` (also `npx @stackra/cli create <directory>`), the `laravel
 *          new` of Stackra: shows the banner, refuses a folder that is not empty, asks the name, npm scope, edition
 *          and package manager (each also a flag; `--yes` takes every default; without a terminal nothing is asked),
 *          fetches the starter (`@stackra/starter` from the Stackra registry at the CLI's version, or `--starter
 *          <dir|tgz>`), runs the doctor for what the profile needs, writes the profile's files under the chosen
 *          names, installs, runs `stackra gen` and shows what it wrote as a tree, each step a task, type-checks and tests, makes the
 *          first commit and prints the next steps.
 * Boundary: writes only inside `<directory>` and runs pnpm, gen and git there. The starter tarball is checked
 *           against the registry's SHA-512 integrity; `STACKRA_LICENCE_TOKEN` is checked for presence only and sent
 *           only to the registry origin. A failed step stops the run, keeps the folder and names the step.
 * Runtime: node
 * Governing contract: ADR 0515; STA-1952 spec User Story 1, FR-001 to FR-013; STA-1730 (the console create flow).
 */
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";

import { Argument, Command, Option, type CommandIo } from "@stackra/console";
import { tarballSpecs } from "@stackra/console/node";
import { Str } from "@stackra/validation";

import { genTree } from "#node/create/functions/gen-tree.function";
import { readStarter } from "#node/create/functions/read-starter.function";
import { starterFiles } from "#node/create/functions/starter-files.function";
import { starterTarball } from "#node/create/functions/starter-tarball.function";
import { starterWorkspace } from "#node/create/functions/starter-workspace.function";
import { doctorChecks } from "#node/doctor/functions/doctor-checks.function";
import { renderDoctor } from "#node/doctor/functions/render-doctor.function";
import { cliVersion } from "#node/functions/cli-version.function";
import { httpCatalogueClient } from "#node/functions/http-catalogue-client.function";
import { registryOrigin } from "#node/functions/registry-origin.function";

/** A package name. */
const NAME = /^[a-z0-9][a-z0-9-._~]*$/;

/** An npm scope. */
const SCOPE = /^@[a-z0-9][a-z0-9-._~]*$/;

/** The published starter. */
const STARTER = "@stackra/starter";

/** Creates a new Stackra app. */
export class CreateCommand extends Command({
  name: "create",
  description:
    "Create a new Stackra app: a web console and a service, generated, installed and tested",
  bin: true,
}) {
  /** Where to create it. */
  @Argument({ description: "The folder to create the app in (missing or empty)" })
  directory!: string;

  /** The package name. */
  @Option({ description: "The app's package name (default: the folder name)" })
  @Str({ pattern: NAME })
  name?: string;

  /** The npm scope. */
  @Option({ description: "The npm scope of its members, @kebab (default: @<name>)" })
  @Str({ pattern: SCOPE })
  scope?: string;

  /** The edition to create, `free` or `pro`. */
  @Option({ description: "free, or pro with STACKRA_LICENCE_TOKEN set" })
  @Str({ pattern: /^(free|pro)$/ })
  edition?: string;

  /** The package manager. */
  @Option({ description: "The package manager; pnpm (the workspace uses pnpm catalogs)" })
  @Str({ pattern: /^pnpm$/ })
  pm?: string;

  /** The starter profile. */
  @Option({ description: "The starter profile: minimal (a console and one service) or full" })
  @Str({ pattern: /^[a-z][a-z0-9-]*$/ })
  profile = "minimal";

  /** Take every default. */
  @Option({ description: "Ask nothing; take every default" })
  yes = false;

  /** A local starter. */
  @Option({
    description: "Read the starter from a template checkout or a .tgz instead of the registry",
  })
  @Str
  starter?: string;

  /** Packed `@stackra/*` tarballs to install from. */
  @Option({
    description: "Install @stackra packages from the tarballs in this folder (pre-release checks)",
  })
  @Str
  tarballs?: string;

  /** Run the doctor first. */
  @Option({ description: "Check the machine first (--no-doctor to skip)" })
  doctor = true;

  /** Install the dependencies. */
  @Option({
    description: "Install, generate and check (--no-install stops after writing the files)",
  })
  install = true;

  /** Type-check and test. */
  @Option({ description: "Type-check and test after gen (--no-check to skip)" })
  check = true;

  /** Make the first commit. */
  @Option({ description: "git init and the first commit (--no-git to skip)" })
  git = true;

  /** Creates the app and returns what it made. */
  async handle(io: CommandIo): Promise<Readonly<Record<string, unknown>>> {
    io.output.banner();
    const cwd = io.cwd;
    const directory = resolve(cwd, this.directory);
    if (existsSync(directory) && readdirSync(directory).length > 0)
      throw new Error(`${directory} exists and is not empty; choose a new folder`);

    const ask = async <T>(
      flag: T | undefined,
      fallback: T,
      question: () => Promise<T>,
    ): Promise<T> => flag ?? (this.yes ? fallback : await question());
    const folderName = basename(directory)
      .toLowerCase()
      .replaceAll(/[^a-z0-9-]+/g, "-");
    const name = await ask(this.name, folderName, () =>
      io.prompt.text({
        message: "What is the app called?",
        default: folderName,
        validate: (value) =>
          NAME.test(value) ? undefined : "Use lower-case letters, digits and dashes",
        option: "name",
      }),
    );
    const scope = await ask(this.scope, `@${name}`, () =>
      io.prompt.text({
        message: "Which npm scope do its members use?",
        default: `@${name}`,
        validate: (value) =>
          SCOPE.test(value) ? undefined : "Use @ and lower-case letters, digits and dashes",
        option: "scope",
      }),
    );
    const licensed = Boolean(process.env["STACKRA_LICENCE_TOKEN"]);
    const edition = await ask(this.edition, "free", () =>
      io.prompt.select({
        message: "Which edition?",
        default: "free",
        choices: [
          { value: "free", label: "Free" },
          ...(licensed ? [{ value: "pro", label: "Pro", hint: "your licence is set" }] : []),
        ],
        option: "edition",
      }),
    );
    if (edition === "pro" && !licensed)
      throw new Error(
        "the Pro edition needs STACKRA_LICENCE_TOKEN; create the free edition or set your licence",
      );
    const pm = await ask(this.pm, "pnpm", () =>
      io.prompt.select({
        message: "Which package manager?",
        default: "pnpm",
        choices: [{ value: "pnpm", hint: "the workspace uses pnpm catalogs" }],
        option: "pm",
      }),
    );

    const version = cliVersion();
    const starter = await io.output.task("Fetching the starter", () =>
      this.readStarter(cwd, version),
    );
    const files = starterFiles(starter, {
      profile: this.profile,
      name,
      scope,
      stackraVersion: version,
      ...(this.tarballs === undefined
        ? {}
        : { tarballs: tarballSpecs(resolve(cwd, this.tarballs)) }),
    });

    if (this.doctor) {
      const results = await io.output.task("Checking the machine", () =>
        doctorChecks(dirname(directory), starterWorkspace(files), { fresh: true }),
      );
      if (results.some((result) => result.status !== "ok")) {
        for (const line of renderDoctor(results).split("\n")) io.output.line(line);
        if (
          !(await io.prompt.confirm({
            message: "Create the app anyway? (`stackra dev` stops until these are fixed)",
            default: true,
          }))
        )
          return { directory, created: false };
      }
    }

    await io.output.task(`Writing ${files.size} files (profile ${this.profile})`, () => {
      for (const [path, bytes] of files) {
        const target = join(directory, path);
        mkdirSync(dirname(target), { recursive: true });
        writeFileSync(target, bytes);
      }
    });

    // A failed step ends the run and its task shows the tail of the step's output (the process port's detail).
    const step = (command: string, args: readonly string[]) =>
      io.process.run(command, args, { cwd: directory });
    let generated: string[] = [];
    if (this.install) {
      await io.output.task(`Installing with ${pm}`, () => step(pm, ["install"]));
      const wrote = await io.output.task("Running stackra gen", () =>
        step(pm, ["exec", "stackra", "gen"]),
      );
      generated = [...wrote.output.matchAll(/^wrote (\S+)$/gm)].map((match) => match[1] ?? "");
      io.output.title(`stackra gen wrote ${generated.length} files`);
      io.output.tree(genTree(generated));
      if (this.check) {
        await io.output.task("Type-checking", () => step(pm, ["run", "typecheck"]));
        await io.output.task("Testing", () => step(pm, ["run", "test"]));
      }
    }

    if (this.git) {
      try {
        await io.output.task("Making the first commit", async () => {
          await step("git", ["init", "-q"]);
          await step("git", ["add", "-A"]);
          await step("git", ["commit", "-q", "-m", "chore: create the app with stackra create"]);
        });
      } catch (error) {
        io.output.warn(
          `the folder is ready but not committed: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    io.output.note(
      [
        `cd ${this.directory}`,
        ...(this.install ? [] : [`${pm} install`, `${pm} exec stackra gen`]),
        `${pm} dev`,
        "stackra doctor        # what the machine still needs",
        "https://docs.stackra.figentra.com",
      ].join("\n"),
      "info",
      "Next",
    );
    return { directory, name, scope, edition, profile: this.profile, files: files.size, generated };
  }

  /** The starter: `--starter`, else the registry's at the CLI's version, else its latest. */
  private async readStarter(cwd: string, version: string): Promise<Map<string, Uint8Array>> {
    if (this.starter !== undefined) return readStarter(resolve(cwd, this.starter));
    const client = httpCatalogueClient({
      origin: registryOrigin(cwd, undefined),
      token: process.env["STACKRA_LICENCE_TOKEN"] || undefined,
    });
    // shortcut: falls back to `latest` when the CLI's own version has no starter; pick the newest of the CLI's minor
    // line once the catalogue lists versions.
    const { bytes } = await client
      .tarball(STARTER, version)
      .catch(() => client.tarball(STARTER, "latest"));
    return starterTarball(bytes);
  }
}
