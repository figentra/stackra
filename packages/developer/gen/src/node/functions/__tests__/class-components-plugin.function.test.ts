/**
 * Stackra file contract:
 * Purpose: unit tests of `classComponentsPlugin`: the mapping of ADR 0305 rule 38 (state fields with lazy or direct
 *          initializers and typed `useState`, hook fields, methods and getters, `mount`/`unmount` through
 *          `useEffectEvent` and one effect, `render` as the tail, `this.props`), the setter and updater forms of a
 *          write, the React import merged, the `#stackra/ui` import removed, other files and React's own
 *          `Component` untouched, and each refused form failing with a code frame.
 * Boundary: test only; runs Babel in memory.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0305 (rules 37 to 41); the STA-402 spike checks.
 */
import { transformSync } from "@babel/core";
import { describe, expect, it } from "@stackra/testing";

import { classComponentsPlugin } from "#node/functions/class-components-plugin.function";

/** The plugin's output for `code`. */
function compile(code: string): string {
  return (
    transformSync(code, {
      filename: "counter.tsx",
      babelrc: false,
      configFile: false,
      parserOpts: { plugins: ["jsx", "typescript"] },
      plugins: [classComponentsPlugin],
    })?.code ?? ""
  );
}

const COUNTER = [
  'import { useState as keep } from "react";',
  'import { Component } from "#stackra/ui";',
  'import type { CounterProps } from "./counter.props";',
  'import { useTranslation } from "./use-translation";',
  "",
  "export class Counter extends Component<CounterProps> {",
  "  count = this.props.start ?? 0;",
  "  label = 'clicks';",
  "  history: number[] = [];",
  "  t = useTranslation();",
  "",
  "  get doubled() {",
  "    return this.count * 2;",
  "  }",
  "",
  "  increment() {",
  "    this.count++;",
  "    this.history = [...this.history, this.count];",
  "  }",
  "",
  "  rename(next: string) {",
  "    this.label = next;",
  "  }",
  "",
  "  mount() {",
  "    console.info(this.count);",
  "  }",
  "",
  "  unmount() {",
  "    console.info('bye');",
  "  }",
  "",
  "  render() {",
  "    return <button onClick={() => this.increment()}>{this.t('x')} {this.doubled}</button>;",
  "  }",
  "}",
  "",
].join("\n");

/** A component class around `body`. */
function wrap(body: string): string {
  return `import { Component } from "#stackra/ui";\nexport class X extends Component<{}> {\n${body}\n}\n`;
}

describe("classComponentsPlugin", () => {
  const out = compile(COUNTER);

  it("compiles the class into a function component", () => {
    expect(out).toContain("export function Counter(props: CounterProps)");
    expect(out).toContain("const [count, setCount] = useState(() => props.start ?? 0);");
    expect(out).toContain("const [label, setLabel] = useState('clicks');");
    expect(out).toContain("const [history, setHistory] = useState<number[]>(() => []);");
    expect(out).toContain("const t = useTranslation();");
    expect(out).toContain("function doubled() {");
    expect(out).toContain("return count * 2;");
    expect(out).toContain("function rename(next: string) {");
    expect(out).toContain("setLabel(next);");
    expect(out).toMatch(/setCount\((\w+) => \1 \+ 1\);/);
    expect(out).toMatch(/setHistory\((\w+) => \[\.\.\.\1, count\]\);/);
    expect(out).toContain("const mount = useEffectEvent(() => {");
    expect(out).toContain("useEffect(() => {");
    expect(out).toContain("{t('x')} {doubled()}");
    expect(out).not.toContain("#stackra/ui");
    expect(out).toMatch(
      /import \{ useState as keep, useEffect, useEffectEvent, useState \} from "react";/,
    );
  });

  it("leaves other files and React's own Component alone", () => {
    const plain = 'import { Component } from "react";\nexport class Legacy extends Component {}\n';
    expect(compile(plain)).toContain("export class Legacy extends Component {}");
  });

  it("refuses the forms the mapping does not support", () => {
    expect(() =>
      compile(wrap("  render() { return null; }\n  constructor() { super(); }")),
    ).toThrow(/no constructor/);
    expect(() =>
      compile(
        wrap(
          "  items: number[] = [];\n  add() { this.items.push(1); }\n  render() { return null; }",
        ),
      ),
    ).toThrow(/immutable/);
    expect(() => compile(wrap("  count = 0;"))).toThrow(/needs a render\(\) method/);
    expect(() => compile(wrap("  static x = 1;\n  render() { return null; }"))).toThrow(
      /Static members/,
    );
    expect(() => compile(wrap("  render() { return this; }"))).toThrow(/only as `this.member`/);
    expect(() => compile(wrap("  render() { return this.missing; }"))).toThrow(
      /no member "missing"/,
    );
  });
});
