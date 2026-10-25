/**
 * Stackra file contract:
 * Purpose: unit tests of `compileClassComponents`: a file without the `#stackra/ui` import is skipped, a component
 *          file compiles with a source map naming the class file (Babel records its base name), `.ts` files parse
 *          without JSX, and `retainLines`
 *          keeps the render body on its source line.
 * Boundary: test only; runs Babel in memory.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0305 (rules 38 to 40).
 */
import { describe, expect, it } from "@stackra/testing";

import { compileClassComponents } from "#node/functions/compile-class-components.function";

const SOURCE = [
  'import { Component } from "#stackra/ui";',
  "",
  "export class Hello extends Component<{ name: string }> {",
  "  render() {",
  "    return <p>{this.props.name}</p>;",
  "  }",
  "}",
  "",
].join("\n");

describe("compileClassComponents", () => {
  it("skips a file without a component import", async () => {
    expect(await compileClassComponents("export const x = 1;\n", "x.tsx")).toBeUndefined();
  });

  it("compiles a component with a source map", async () => {
    const out = await compileClassComponents(SOURCE, "src/components/hello/hello.tsx");
    expect(out?.code).toContain("export function Hello(props: {");
    expect(out?.code).toContain("<p>{props.name}</p>");
    expect(out?.map).toMatchObject({ sources: ["hello.tsx"] });
  });

  it("parses .ts files without JSX and can retain lines", async () => {
    const ts = SOURCE.replace("<p>{this.props.name}</p>", "this.props.name");
    expect((await compileClassComponents(ts, "hello.ts"))?.code).toContain("return props.name;");
    const retained = await compileClassComponents(SOURCE, "hello.tsx", { retainLines: true });
    const lines = (retained?.code ?? "").split("\n");
    expect(lines[4]).toContain("<p>{props.name}</p>");
  });
});
