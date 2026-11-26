/**
 * Stackra file contract:
 * Purpose: `CodemodReport`, the part of a codemod that finds code no mechanical edit can fix (a custom driver that
 *          must implement a new method, a removed class): an ast-grep rule, the modules a file must import from to be
 *          searched, and the instruction each match prints.
 * Boundary: type only; the rule is ast-grep's own rule object, run by `reportCodemodFindings`.
 * Runtime: node
 * Governing contract: ADR 0199 (decision 2); STA-145.
 */
import type { NapiConfig } from "@ast-grep/napi";

/** What a codemod reports for a person to change. */
export type CodemodReport = {
  /** A file is searched only when it imports or re-exports from one of these module specifiers. */
  readonly modules: readonly string[];

  /** The ast-grep rule whose matches are reported. */
  readonly rule: NapiConfig["rule"];

  /** What to do at each match, one sentence. */
  readonly message: string;
};
