/**
 * Stackra file contract:
 * Purpose: `manualLine(origin, cli, forwarded)`, the run `create-stackra` would start, as one `npx` line a developer
 *          can paste into a POSIX shell (each argument quoted when it needs it).
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0199 (amendment of 2026-11-27).
 */
import { npxArguments } from "#node/functions/npx-arguments.function";

/** An argument as a POSIX shell reads it back. */
const quote = (arg: string): string =>
  /^[\w@%+=:,./-]+$/.test(arg) ? arg : `'${arg.replaceAll("'", `'\\''`)}'`;

/**
 * The run as one `npx` line.
 *
 * @param origin - the Stackra registry origin.
 * @param cli - the `@stackra/cli` version or dist-tag.
 * @param forwarded - the arguments for `stackra create`.
 * @example
 * manualLine("https://npm.stackra.figentra.com/", "latest", ["my-app"]);
 * // "npx --yes --@stackra:registry=https://npm.stackra.figentra.com/ @stackra/cli@latest create my-app"
 */
export function manualLine(origin: string, cli: string, forwarded: readonly string[]): string {
  return ["npx", ...npxArguments(origin, cli, forwarded)].map(quote).join(" ");
}
