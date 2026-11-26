/**
 * Stackra file contract:
 * Purpose: the `DevToolHost` port: what the local MCP's own tool commands are built with, the CLI runner every write
 *          and gate goes through and the environment the server runs in.
 * Boundary: an abstract class that is its own token, kept in `.`. `serveLocalMcp` implements it over the runner it was
 *           given (`@stackra/cli`'s in-process command core, or the `stackra` binary) and hands it to each tool
 *           command through the tool container; nothing else implements it.
 * Runtime: isomorphic
 * Governing contract: ADR 0282 (decision 5: local writes go through the same commands and gates as the CLI); ADR 0294
 *                     (decision 25: ports); STA-2873.
 */
import { Port } from "@stackra/contracts";

/**
 * Runs `stackra` commands for a tool and says where the server runs.
 *
 * @example
 * const { exitCode, output } = await host.run(["test", "--tier=unit"], { cwd: "/repo/services/commerce" });
 */
export abstract class DevToolHost extends Port {
  /**
   * Runs one `stackra` command (its arguments without the program name) in `cwd`, an absolute folder inside the
   * repository, or in the repository root; resolves with its exit code and its combined output.
   */
  abstract run(
    args: readonly string[],
    options?: { readonly cwd?: string },
  ): Promise<{ readonly exitCode: number; readonly output: string }>;

  /** The environment the server runs in (`STACKRA_ENVIRONMENT` says whether it is deployed). */
  abstract environment(): Readonly<Record<string, string | undefined>>;
}
