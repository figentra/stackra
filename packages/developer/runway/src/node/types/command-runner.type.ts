/**
 * Stackra file contract:
 * Purpose: `CommandRunner`, how a provider runs one command: the program, its arguments, the folder, what to write
 *          to its standard input and where each line it prints goes while it runs, answering its standard output or
 *          throwing when it exits with an error.
 * Boundary: type only; `runProgram` is the real one, a test passes a fake. Credentials are never arguments: each CLI
 *           reads its own login (OIDC in CI, the owner's session in a terminal), and a value a command must receive
 *           (a Worker secret) goes in `input`. `onLine` receives the line as printed: the caller masks secrets.
 * Runtime: node
 * Governing contract: ADR 0352 (decisions 3 and 6: the same commands in CI and a terminal), ADR 0173; STA-2860.
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
    /**
     * Each line the program prints, standard output and standard error, as it prints it (without its line break); the
     * standard output is still answered whole. Unset, nothing is streamed.
     */
    readonly onLine?: ((line: string) => void) | undefined;
  },
) => Promise<string>;
