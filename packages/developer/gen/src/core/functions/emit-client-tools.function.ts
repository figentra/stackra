/**
 * Stackra file contract:
 * Purpose: `emitClientTools`, an app's client tool table (`.stackra/gen/client-tools.ts`, reached as
 *          `#stackra/client-tools`): the app member's key, a hash of the rows and one row per client tool, each marked
 *          `from: "client"` and `risk: "L0"`, sorted by declaring module then key.
 * Boundary: pure. The rows are `clientToolsOf`'s; nothing is written for a member that is not an app or an app with no
 *           client tool. The table is typed `ClientToolTable` from `@stackra/ai/contracts` only when the app declares
 *           `@stackra/ai`, so an app without it still gets a self-contained file. The hash is a 53-bit text hash of the
 *           rows (equal rows, equal hash), which the SDK sends so the server offers a surface only the table it holds.
 *           It is not a security hash.
 * Runtime: isomorphic
 * Governing contract: ADR 0490 (decisions 1, 3 and 16); ADR 0294 (decision 10: deterministic output); STA-1631.
 */
import { clientToolsOf } from "#core/functions/client-tools-of.function";
import { generatedHeader } from "#core/functions/generated-header.function";
import { toolName } from "#core/functions/tool-name.function";
import type { GenError } from "#core/types/gen-error.type";
import type { MemberIR } from "#core/types/member-ir.type";

/** cyrb53: a fast 53-bit hash of `text`, base 36. */
function hashOf(text: string): string {
  let h1 = 0xde_ad_be_ef;
  let h2 = 0x41_c6_ce_57;
  for (let index = 0; index < text.length; index += 1) {
    const code = text.codePointAt(index) ?? 0;
    h1 = Math.imul(h1 ^ code, 2_654_435_761);
    h2 = Math.imul(h2 ^ code, 1_597_334_677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2_246_822_507) ^ Math.imul(h2 ^ (h2 >>> 13), 3_266_489_909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2_246_822_507) ^ Math.imul(h1 ^ (h1 >>> 13), 3_266_489_909);
  return (4_294_967_296 * (2_097_151 & h2) + (h1 >>> 0)).toString(36);
}

/**
 * The client tool table of `ir`, and the refusals of its tools.
 *
 * @example
 * emitClientTools(appIr).content?.includes("export const clientTools"); // true
 */
export function emitClientTools(ir: MemberIR): {
  readonly content: string | undefined;
  readonly errors: readonly GenError[];
} {
  const { tools, errors } = clientToolsOf(ir);
  if (tools.length === 0) return { content: undefined, errors };
  const rows = tools.map((tool) => ({
    key: tool.key,
    name: toolName(tool.key),
    from: "client" as const,
    risk: "L0" as const,
    kind: tool.kind,
    target: tool.target,
    module: tool.module,
    ...(tool.permission === undefined ? {} : { permission: tool.permission }),
    inputSchema: tool.inputSchema,
  }));
  const typed = (ir.packages ?? []).includes("@stackra/ai");
  const header = generatedHeader({
    from: "the routes, panel resources, action placements, theming, tours and anchors of the app",
    purpose: `the client tool table of ${ir.package}: one row per tool the agent may call to change the viewer's screen.`,
    boundary:
      "every row is L0 and changes only the screen; a write is a server action. The hash identifies the rows, so a " +
      "surface holding an older table is offered none.",
    runtime: "isomorphic",
  });
  return {
    content: [
      header,
      ...(typed ? ['import type { ClientToolTable } from "@stackra/ai/contracts";', ""] : [""]),
      "/** The client tools of this app, by declaring module then key. */",
      `export const clientTools${typed ? ": ClientToolTable" : ""} = {`,
      `  app: ${JSON.stringify(ir.member)},`,
      `  hash: ${JSON.stringify(hashOf(JSON.stringify(rows)))},`,
      "  tools: [",
      ...rows.map((row) => `    ${JSON.stringify(row)},`),
      `  ],`,
      typed ? "};" : "} as const;",
      "",
    ].join("\n"),
    errors,
  };
}
