/**
 * Stackra file contract:
 * Purpose: unit tests of `corePlugins`: the class-component pass first, then `#stackra/*` and the `.server` refusal;
 *          the pass is added once when the given plugins (nested arrays included) already hold it; and the wired pass
 *          compiles a component class through gen.
 * Boundary: test only; runs gen's real pass on a one-class source.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0305 (rules 38 to 40); registry v3.1 A14.
 */
import { classComponents } from "@stackra/gen/node";
import { describe, expect, it } from "@stackra/testing";

import { corePlugins } from "#core/functions/core-plugins.function";

const COUNTER = `import { Component } from "#stackra/ui";
export class Counter extends Component<{ start: number }> {
  count = 0;
  render() {
    return <button onClick={() => this.count++}>{this.count}</button>;
  }
}
`;

describe("corePlugins", () => {
  it("runs the class-component pass first, then #stackra/* and the .server refusal", () => {
    expect(corePlugins().map(({ name }) => name)).toEqual([
      "stackra:class-components",
      "stackra:generated-modules",
      "stackra:server-only",
    ]);
  });

  it("adds the pass once when the config already runs it", () => {
    expect(corePlugins([[classComponents()]]).map(({ name }) => name)).toEqual([
      "stackra:generated-modules",
      "stackra:server-only",
    ]);
  });

  it("wires gen's pass: a component class becomes a function component", async () => {
    const pass = corePlugins()[0];
    const transform = pass?.transform as (
      code: string,
      id: string,
    ) => Promise<{ code: string } | null>;
    const result = await transform(COUNTER, "/app/src/components/counter/counter.tsx");
    expect(pass?.enforce).toBe("pre");
    expect(result?.code).toMatch(/function Counter\(/);
    expect(result?.code).toMatch(/useState/);
    expect(await transform("export const x = 1;", "/app/src/x.tsx")).toBeNull();
  });
});
