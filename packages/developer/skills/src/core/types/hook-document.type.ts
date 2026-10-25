/**
 * Stackra file contract:
 * Purpose: `HookDocument`, a parsed hook: the event it runs on, an optional tool matcher, the command line it runs,
 *          and a Markdown body that explains it.
 * Boundary: type only; `parseAgentDocument("hook", …)` returns it.
 * Runtime: isomorphic
 * Governing contract: ADR 0282 (decisions 2 and 9).
 */
import type { HookEvent } from "#core/enums/hook-event.enum";

/** One hook an assistant runs on an event. */
export type HookDocument = {
  /** The document kind, always `hook`. */
  readonly kind: "hook";
  /** Kebab-case, from the file name. */
  readonly name: string;
  /** One line on what the hook guards or adds. */
  readonly description: string;
  /** The event it runs on. */
  readonly event: HookEvent;
  /** Tool names the hook applies to (`Bash`, `Write|Edit`), for the tool events; absent for every tool. */
  readonly matcher?: string;
  /** The command line the assistant runs. */
  readonly run: string;
  /** The Markdown after the frontmatter. */
  readonly body: string;
  /** The file path the document was parsed from, as given. */
  readonly source: string;
};
