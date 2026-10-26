/**
 * Stackra file contract:
 * Purpose: `CommandRunner`, how a provider runs one command: the program, its arguments and the folder, answering its
 *          standard output or throwing when it exits with an error.
 * Boundary: type only; `runCommand` is the real one, a test passes a fake. Credentials are never arguments: each CLI
 *           reads its own login (OIDC in CI, the owner's session in a terminal).
 * Runtime: node
 * Governing contract: ADR 0352 (decisions 3 and 6: the same commands in CI and a terminal).
 */

/** Runs one command and answers its standard output. */
export type CommandRunner = (
  command: string,
  args: readonly string[],
  options: { readonly cwd?: string | undefined },
) => Promise<string>;
