/**
 * Stackra file contract:
 * Purpose: `parseShellRef(text)`, a root runway shell reference (`os/console@3`) as a `ShellRef`.
 * Boundary: pure; refuses anything that is not `<owner>/<name>@<major>` in lower-case kebab, so the parts are safe as
 *           path and URL segments.
 * Runtime: node
 * Governing contract: ADR 0436 (decision 4: `targets: console@N`); app-shells section 8.2.
 */
import { CliUsageError } from "#node/errors/cli-usage.error";
import type { ShellRef } from "#node/dev-surface/types/shell-ref.type";

/** `<owner>/<name>@<major>`, each name lower-case kebab. */
const SHELL_REF = /^([a-z][a-z0-9-]*)\/([a-z][a-z0-9-]*)@(\d+)$/;

/**
 * The shell reference `text` names.
 *
 * @param text - the runway value.
 * @throws CliUsageError when it is not `<owner>/<name>@<major>`.
 * @example
 * parseShellRef("os/console@3"); // { owner: "os", name: "console", line: 3 }
 */
export function parseShellRef(text: string): ShellRef {
  const match = SHELL_REF.exec(text);
  if (match === null) {
    throw new CliUsageError(`bad shell reference: ${text} (expected <owner>/<name>@<major>)`);
  }
  return { owner: match[1] as string, name: match[2] as string, line: Number(match[3]) };
}
