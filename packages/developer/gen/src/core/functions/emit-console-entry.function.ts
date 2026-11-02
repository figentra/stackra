/**
 * Stackra file contract:
 * Purpose: `emitConsoleEntry`, a member's console entry (`.stackra/entry/console.ts`): it builds the console of the
 *          member from `#stackra/commands` with `createConsole({ name, version, commands, container })` and runs the
 *          arguments after the script, setting the process exit code from the run (ADR 0506 decision 6).
 * Boundary: pure; no logic in the entry. The container factory boots the member's generated wiring through `bootApp`,
 *           and runs only when a command is dispatched, so `--help`, the list and `--version` need no database or
 *           network (FR-010). A server's `#stackra/registrations` load first, so entities and models are registered.
 *           No entry for a package (it runs in its host) or for a member with no commands.
 * Runtime: node
 * Governing contract: ADR 0506 (decision 6); ADR 0295 (generated entries); STA-1731 spec FR-008 and FR-010.
 */
import { generatedHeader } from "#core/functions/generated-header.function";
import type { GeneratedFile } from "#core/types/generated-file.type";
import type { MemberIR } from "#core/types/member-ir.type";

/**
 * The console entry of `ir`, or undefined when the member has none.
 *
 * @param ir - the member read by discovery.
 * @param generated - the paths this run writes, so the entry loads only the generated files that exist.
 * @example
 * emitConsoleEntry(serviceIr, paths)?.path; // ".stackra/entry/console.ts"
 */
export function emitConsoleEntry(
  ir: MemberIR,
  generated: readonly string[],
): GeneratedFile | undefined {
  if (ir.layout === "package" || !generated.includes(".stackra/gen/commands.ts")) return undefined;
  const wired = generated.includes(".stackra/gen/wiring.ts");
  // An own action or query that declares `command` becomes a generated class that needs the app's container.
  const actions =
    wired &&
    ir.classes.some(
      (declared) =>
        (declared.kind === "action" || declared.kind === "query") &&
        declared.options["command"] !== undefined &&
        declared.options["command"] !== false,
    );
  const registrations = generated.includes(".stackra/gen/registrations.ts");
  return {
    path: ".stackra/entry/console.ts",
    content: [
      generatedHeader({
        from: "#stackra/commands and #stackra/wiring",
        purpose: `the console entry of ${ir.package}: runs its commands and its hosted packages' with the generated wiring.`,
        boundary:
          "no logic; the container is created only when a command is dispatched, so the list, `--help` and `--version` " +
          "need no database. `stackra console` loads it through Vite (its commands carry decorators, which Node's " +
          "type stripping refuses) and calls `run`; the exit code is the command's.",
        runtime: "node",
      }),
      ...(registrations ? ['import "#stackra/registrations";'] : []),
      ...(wired ? ['import { bootApp } from "@stackra/app";'] : []),
      'import { createConsole } from "@stackra/console";',
      'import { nodePorts } from "@stackra/console/node";',
      `import { ${actions ? "ACTION_COMMANDS, COMMANDS" : "COMMANDS"} } from "#stackra/commands";`,
      ...(wired ? ['import { wiring } from "#stackra/wiring";'] : []),
      "",
      "const app = createConsole({",
      `  name: ${JSON.stringify(ir.member)},`,
      `  version: ${JSON.stringify(ir.version)},`,
      "  commands: COMMANDS,",
      ...(actions
        ? [
            "  container: async () => {",
            "    const container = (await bootApp(wiring, { env: process.env })).container;",
            "    // an action command takes the app's container as its resolver; any other class is built by the container",
            "    return {",
            "      get: (type) => (ACTION_COMMANDS.has(type) ? Reflect.construct(type, [container]) : container.get(type)),",
            "      has: (type) => ACTION_COMMANDS.has(type) || container.has?.(type) === true,",
            "      close: () => container.close(),",
            "    };",
            "  },",
          ]
        : wired
          ? ["  container: async () => (await bootApp(wiring, { env: process.env })).container,"]
          : []),
      "});",
      "",
      "/** Runs the console with `argv`, the arguments after the member; resolves to the command's exit code. */",
      "export const run = (argv: readonly string[]): Promise<number> => app.run(argv, nodePorts());",
      "",
    ].join("\n"),
  };
}
