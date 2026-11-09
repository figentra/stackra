/**
 * Stackra file contract:
 * Purpose: `emitUiFacade`, the class-component facade: `.stackra/gen/ui.ts`, reached as `#stackra/ui`, which
 *          re-exports `Component` from the member's client entry of `@stackra/ui` (`native` for an app that renders
 *          only on iOS and Android, `react` otherwise), so a `class X extends Component<P>` type-checks.
 * Boundary: pure. Nothing is written for a member that does not declare `@stackra/ui` (the re-export would not
 *           resolve), nor for an IR without a package list. One file serves an app with web and native targets: both
 *           entries export the same type-level `Component<P>`, and the class-components compiler removes the import
 *           before any bundle loads it.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rule 37: `Component` comes from `#stackra/ui`); ADR 0261 (`#stackra/<name>` is a
 *                     file in `.stackra/gen/`); ADR 0295 (decisions 7 and 8: an entry per runtime); STA-2069.
 */
import { clientRuntimes } from "#core/functions/client-runtimes.function";
import { generatedHeader } from "#core/functions/generated-header.function";
import type { MemberIR } from "#core/types/member-ir.type";

/**
 * The `#stackra/ui` file of `ir`, or undefined when it does not declare `@stackra/ui`.
 *
 * @param ir - the member read by discovery, with its package list and targets.
 * @example
 * emitUiFacade(ir); // the generated header, then 'export { Component } from "@stackra/ui/react";'
 */
export function emitUiFacade(ir: MemberIR): string | undefined {
  if (ir.packages?.includes("@stackra/ui") !== true) return undefined;
  const runtimes = clientRuntimes(ir);
  const entry = runtimes.length === 1 && runtimes[0] === "native" ? "native" : "react";
  return [
    generatedHeader({
      from: "the member's `@stackra/ui` dependency and its targets",
      purpose: `the \`Component<P>\` base of ${ir.package}'s class components, from \`@stackra/ui/${entry}\`.`,
      boundary:
        "reached as `#stackra/ui`; a type-level re-export the class-components compiler removes before a bundle " +
        "loads it. Change the dependency or the targets and run `stackra gen`.",
      runtime: "isomorphic",
    }),
    `export { Component } from "@stackra/ui/${entry}";`,
    "",
  ].join("\n");
}
