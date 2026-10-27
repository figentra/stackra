/**
 * Stackra file contract:
 * Purpose: `ImportMap`, the shell's import map as the edge's `shell:<surface>:<major>` record carries it: bare
 *          specifiers (and `/`-ending prefixes) to the URLs of the shared modules the shell provides.
 * Boundary: a type only; the WHATWG import map's `imports` block. Scopes are not read: a bundle resolves only top-level
 *           specifiers through the shell.
 * Runtime: node
 * Governing contract: ADR 0436 (decision 4: shared dependencies through the shell's import map);
 *                     app-shells-edge-and-extension.md 4.1.
 */

/** A shell's import map. */
export type ImportMap = {
  /** Each bare specifier or `/`-ending prefix mapped to the URL of the shared module the shell serves for it. */
  readonly imports: Readonly<Record<string, string>>;
};
