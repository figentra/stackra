/**
 * Stackra file contract:
 * Purpose: `RouteDecision`, what one argument vector asks for, decided before any container exists: the command list, the
 *          version, a command's help, a run, a usage problem (an unknown command or bad arguments), a completion
 *          script, or the candidates a completion script asks for.
 * Boundary: a type only; `route` decides it, `createConsole` acts on it.
 * Runtime: isomorphic
 * Governing contract: STA-1966 spec FR-006 and FR-012 to FR-016.
 */
import type { SHELLS } from "#core/constants/shells.constant";
import type { UsageError } from "#core/errors/usage.error";
import type { CommandEntry } from "#core/types/command-entry.type";
import type { GlobalFlags } from "#core/types/global-flags.type";

/** What an invocation asks for. */
export type RouteDecision =
  | { readonly kind: "list"; readonly globals: GlobalFlags }
  | { readonly kind: "version"; readonly globals: GlobalFlags }
  | { readonly kind: "help"; readonly globals: GlobalFlags; readonly entry: CommandEntry }
  | {
      readonly kind: "run";
      readonly globals: GlobalFlags;
      readonly entry: CommandEntry;
      readonly values: Readonly<Record<string, unknown>>;
      /** The raw tokens of a passthrough command; empty otherwise. */
      readonly rest: readonly string[];
    }
  | { readonly kind: "usage"; readonly globals: GlobalFlags; readonly error: UsageError }
  | {
      readonly kind: "completion";
      readonly globals: GlobalFlags;
      readonly shell: (typeof SHELLS)[number];
    }
  | { readonly kind: "complete"; readonly globals: GlobalFlags; readonly words: readonly string[] };
