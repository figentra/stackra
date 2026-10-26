/**
 * Stackra file contract:
 * Purpose: `BrandKitGeneratorDriver`, the `@stackra/brand-kit` driver of the `BrandGenerator` port: runs
 *          `brand-kit generate <kit> --out <out> --store <store> [--screenshots <dir>] --json` in the product
 *          repository and answers the run record the command prints.
 * Boundary: runs the `brand-kit` binary only, through the given `CommandRunner` (no shell), so Runway takes no
 *           dependency on the generator's code; the CI job installs `@stackra/brand-kit` with the repository. The
 *           printed record is checked before it is answered; a missing or malformed one is a plain `Error`, as
 *           `runCommand` throws for a failed command.
 * Runtime: node
 * Governing contract: ADR 0441 (decision 5), ADR 0352 (decision 3: the same commands in CI and a terminal).
 */
import { BrandGenerator } from "#core/ports/brand-generator.port";
import type { BrandGenerateRecord } from "#core/types/brand-generate-record.type";
import type { BrandGenerateRequest } from "#core/types/brand-generate-request.type";
import { runCommand } from "#node/functions/run-command.function";
import type { CommandRunner } from "#node/types/command-runner.type";

/** True when `value` is a run record. */
function isRecord(value: unknown): value is BrandGenerateRecord {
  const record = value as Partial<BrandGenerateRecord> | null;
  return (
    typeof record === "object" &&
    record !== null &&
    typeof record.kit === "string" &&
    typeof record.out === "string" &&
    Array.isArray(record.files) &&
    record.files.every((file) => typeof file === "string")
  );
}

/**
 * Generates brand sets with the `brand-kit` command line.
 *
 * @example
 * const generator = new BrandKitGeneratorDriver({ cwd: repoRoot });
 * await generateBrandSet(root, generator);
 */
export class BrandKitGeneratorDriver extends BrandGenerator {
  private readonly cwd: string | undefined;

  private readonly command: string;

  private readonly run: CommandRunner;

  /**
   * @param options.cwd - the product repository's root; the working folder when absent.
   * @param options.command - the binary; `brand-kit` (on the CI job's path) when absent.
   * @param options.run - the command runner; `runCommand` when absent.
   */
  constructor(
    options: {
      readonly cwd?: string;
      readonly command?: string;
      readonly run?: CommandRunner;
    } = {},
  ) {
    super();
    this.cwd = options.cwd;
    this.command = options.command ?? "brand-kit";
    this.run = options.run ?? runCommand;
  }

  /** Runs the generator and answers its record. */
  override async generate(request: BrandGenerateRequest): Promise<BrandGenerateRecord> {
    const args = ["generate", request.kit, "--out", request.out, "--store", request.store];
    if (request.screenshots !== undefined) args.push("--screenshots", request.screenshots);
    args.push("--json");
    const stdout = await this.run(this.command, args, { cwd: this.cwd });
    let record: unknown;
    try {
      record = JSON.parse(stdout);
    } catch {
      record = undefined;
    }
    if (!isRecord(record))
      throw new Error(`brand-kit generate ${request.kit}: no run record in its output`);
    return record;
  }
}
