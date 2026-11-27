/**
 * Stackra file contract:
 * Purpose: `parseBootstrapArgs(argv)`, the command line of `create-stackra` split into its own options (`--registry`,
 *          `--cli`, `-h`/`--help`, each before `--`) and the arguments for `stackra create`, kept in order. After `--`
 *          every argument is passed on as written, `--help` included.
 * Boundary: pure; refuses an option without its value and a `--cli` that is not a version or dist-tag.
 * Runtime: node
 * Governing contract: ADR 0199 (amendment of 2026-11-27).
 */
import { BootstrapUsageError } from "#node/errors/bootstrap-usage.error";
import type { BootstrapArgs } from "#node/types/bootstrap-args.type";

/** A version or a dist-tag: `0.33.1`, `0.34.0-next.12`, `latest`, `next`; never a path, URL or another package. */
const CLI_SPEC = /^[a-z0-9][a-z0-9.+-]*$/i;

/**
 * The options of `create-stackra` and the arguments it passes on.
 *
 * @param argv - the arguments after the binary.
 * @throws BootstrapUsageError when an option has no value or `--cli` is not a version or dist-tag.
 * @example
 * parseBootstrapArgs(["my-app", "--registry", "http://localhost:8787", "--yes"]);
 * // { registry: "http://localhost:8787", cli: "latest", help: false, forwarded: ["my-app", "--yes"] }
 */
export function parseBootstrapArgs(argv: readonly string[]): BootstrapArgs {
  let registry: string | undefined;
  let cli = "latest";
  let help = false;
  const forwarded: string[] = [];
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index] ?? "";
    if (arg === "--") {
      forwarded.push(...argv.slice(index + 1));
      break;
    }
    if (arg === "-h" || arg === "--help") {
      help = true;
      continue;
    }
    const option = /^--(registry|cli)(?:=(.*))?$/.exec(arg);
    if (option === null) {
      forwarded.push(arg);
      continue;
    }
    const [, name, inline] = option;
    const value = inline ?? argv[index + 1];
    if (inline === undefined) index += 1;
    if (value === undefined || value === "" || (inline === undefined && value.startsWith("-")))
      throw new BootstrapUsageError(`--${name} needs a value`);
    if (name === "registry") registry = value;
    else if (CLI_SPEC.test(value)) cli = value;
    else throw new BootstrapUsageError(`--cli takes a version or dist-tag, not ${value}`);
  }
  return { registry, cli, help, forwarded };
}
