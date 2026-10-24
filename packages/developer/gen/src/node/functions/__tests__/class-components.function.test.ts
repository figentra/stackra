/**
 * Stackra file contract:
 * Purpose: unit tests of `classComponents`, the Vite plugin: it runs before the core plugins, compiles a component
 *          module (query string stripped) with its map, and leaves non-JSX modules, dependencies and plain files
 *          alone.
 * Boundary: test only; calls the plugin's hook directly, without Vite.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0305 (rule 40); registry v3.1 A14.
 */
import { describe, expect, it } from "@stackra/testing";

import { classComponents } from "#node/functions/class-components.function";

const SOURCE =
  'import { Component } from "#stackra/ui";\nexport class A extends Component<{}> {\n  render() { return null; }\n}\n';

describe("classComponents", () => {
  const plugin = classComponents();

  it("is a pre plugin", () => {
    expect(plugin).toMatchObject({ name: "stackra:class-components", enforce: "pre" });
  });

  it("compiles component modules", async () => {
    const out = await plugin.transform(SOURCE, "/repo/apps/web/src/a.tsx?v=123");
    expect(out?.code).toContain("export function A(props: {})");
    expect(out?.map).toBeTruthy();
  });

  it("skips other modules", async () => {
    expect(await plugin.transform(SOURCE, "/repo/apps/web/src/a.ts")).toBeNull();
    expect(await plugin.transform(SOURCE, "/repo/node_modules/x/a.tsx")).toBeNull();
    expect(await plugin.transform("export const x = 1;", "/repo/apps/web/src/b.tsx")).toBeNull();
  });
});
