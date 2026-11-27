/**
 * Stackra file contract:
 * Purpose: `runCreateStackra(argv, host)`, the whole of `create-stackra`: refuses a Node older than the CLI supports,
 *          prints the help, resolves the registry (`--registry`, `STACKRA_REGISTRY`, the default), then runs
 *          `npx --yes --@stackra:registry=<origin> @stackra/cli@<cli> create <arguments>` with `STACKRA_REGISTRY` set
 *          to the same origin (so `stackra create` fetches the starter from it and writes it into the app's `.npmrc`)
 *          and returns its exit code.
 * Boundary: everything it does goes through `host`; it writes no file and changes no npm setting. Exit codes: the
 *           child's; 0 for help; 1 for a Node too old; 2 for a usage error; 127 when npx cannot start (it then
 *           prints the line to run by hand).
 * Runtime: node
 * Governing contract: ADR 0199 (amendment of 2026-11-27); ADR 0453 (decision 10); ADR 0515 (`stackra create`).
 */
import { MIN_NODE_MAJOR } from "#node/constants/min-node-major.constant";
import { STACKRA_CLI_PACKAGE } from "#node/constants/stackra-cli-package.constant";
import { USAGE } from "#node/constants/usage.constant";
import { BootstrapUsageError } from "#node/errors/bootstrap-usage.error";
import { bootstrapRegistry } from "#node/functions/bootstrap-registry.function";
import { manualLine } from "#node/functions/manual-line.function";
import { npxArguments } from "#node/functions/npx-arguments.function";
import { npxCommand } from "#node/functions/npx-command.function";
import { parseBootstrapArgs } from "#node/functions/parse-bootstrap-args.function";
import type { BootstrapHost } from "#node/types/bootstrap-host.type";

/**
 * Runs `create-stackra` and returns its exit code.
 *
 * @param argv - the arguments after the binary.
 * @param host - the machine (`PROCESS_HOST`, or a fake in tests).
 * @example
 * process.exitCode = await runCreateStackra(["my-app"], PROCESS_HOST);
 */
export async function runCreateStackra(
  argv: readonly string[],
  host: BootstrapHost,
): Promise<number> {
  const major = Number.parseInt(host.nodeVersion, 10);
  if (!(major >= MIN_NODE_MAJOR)) {
    host.err(
      `create-stackra needs Node.js ${MIN_NODE_MAJOR} or later; this is ${host.nodeVersion}. Install Node.js ${MIN_NODE_MAJOR} (mise, nvm or nodejs.org) and run it again.`,
    );
    return 1;
  }

  let origin: string;
  let cli: string;
  let forwarded: readonly string[];
  try {
    const args = parseBootstrapArgs(argv);
    if (args.help) {
      host.out(USAGE);
      return 0;
    }
    origin = bootstrapRegistry(args.registry, host.env);
    ({ cli, forwarded } = args);
  } catch (error) {
    if (!(error instanceof BootstrapUsageError)) throw error;
    host.err(`create-stackra: ${error.message}`);
    host.err("Run `create-stackra --help` for its options.");
    return 2;
  }

  const npx = npxCommand(host);
  if (npx === undefined) {
    host.err("create-stackra: npm's npx was not found beside this Node.js. Run instead:");
    host.err(`  ${manualLine(origin, cli, forwarded)}`);
    return 127;
  }
  host.out(
    `Running ${STACKRA_CLI_PACKAGE}@${cli} create, with @stackra/* from ${origin} for this run only.`,
  );
  try {
    return await host.run(npx.command, [...npx.args, ...npxArguments(origin, cli, forwarded)], {
      ...host.env,
      STACKRA_REGISTRY: origin,
    });
  } catch (error) {
    host.err(
      `create-stackra: npx could not start (${error instanceof Error ? error.message : String(error)}). Run instead:`,
    );
    host.err(`  ${manualLine(origin, cli, forwarded)}`);
    return 127;
  }
}
