/**
 * Stackra file contract:
 * Purpose: unit tests of `transform`: a component file reaches the upstream transformer compiled (lines kept), any
 *          other file reaches it unchanged with every Metro parameter passed through.
 * Boundary: test only; uses a stand-in upstream transformer that echoes its input.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0127 2026-10-24 note; ADR 0305 (rule 40).
 */
import { describe, expect, it } from "@stackra/testing";

import { transform } from "#metro-transformer/functions/transform.function";
import { writeMetroProject } from "#metro-transformer/__tests__/fixtures/write-metro-project";

/** The params the stand-in transformer echoes back. */
type Echo = {
  readonly received: {
    readonly src: string;
    readonly filename: string;
    readonly plugins?: unknown[];
  };
};

describe("transform", () => {
  const projectRoot = writeMetroProject();

  it("compiles a component file before the upstream transformer", async () => {
    const src =
      'import { Component } from "#stackra/ui";\nexport class A extends Component<{}> {\n  render() { return null; }\n}\n';
    const out = (await transform({
      filename: "src/a.tsx",
      src,
      options: { projectRoot },
      plugins: [],
    })) as Echo;
    expect(out.received.src).toContain("export function A(props: {})");
    expect(out.received.filename).toBe("src/a.tsx");
    expect(out.received.plugins).toEqual([]);
  });

  it("passes other files through unchanged", async () => {
    const src = "export const x = 1;\n";
    const out = (await transform({ filename: "src/x.ts", src, options: { projectRoot } })) as Echo;
    expect(out.received.src).toBe(src);
  });
});
