/**
 * Stackra file contract:
 * Purpose: `CommandRunner`, how a provider runs one command: the program, its arguments, the folder and what to write
 *          to its standard input, answering its standard output or throwing when it exits with an error.
 * Boundary: type only; `runProgram` is the real one, a test passes a fake. Credentials are never arguments: each CLI
 *           reads its own login (OIDC in CI, the owner's session in a terminal), and a value a command must receive
 *           (a Worker secret) goes in `input`.
 * Runtime: node
 * Governing contract: ADR 0352 (decisions 3 and 6: the same commands in CI and a terminal), ADR 0173.
 */

/** Runs one command and answers its standard output. */
export type CommandRunner = (
  command: string,
  args: readonly string[],
  options: {
    readonly cwd?: string | undefined;
    readonly input?: string | undefined;
    /** Variables added to the inherited environment. */
    readonly env?: Readonly<Record<string, string>> | undefined;
  },
) => Promise<string>;
