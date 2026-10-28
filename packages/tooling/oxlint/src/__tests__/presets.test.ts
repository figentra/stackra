/**
 * Stackra file contract:
 * Purpose: proves every preset in package.json `exports` exists, that base.jsonc loads every house JS plugin from a
 *          source file that exists and turns on every `stackra/*` rule at error, that @stackra/coding-standard is a
 *          peer, that the boundary preset still carries the two non-negotiable patterns (packages never import
 *          apps/services; no deep src imports), and that base.jsonc carries the rule-gap cheap set (stackra-229)
 *          and the B group rows B-1, B-2 and B-5 with no warn level left (stackra-230), plus B-3 (stackra-231)
 *          B-4 (stackra-232), B-6 and B-8 (stackra-233) and B-7 (stackra-234).
 * Boundary: test only; reads the preset files and the plugin's source as text, imports no workspace package.
 * Runtime: node (vitest)
 * Governing contract: ADR 0129; ADR 0421; docs/constitution/boundaries.md; rule-gap list N-1 to N-10, B-1 to B-8.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as {
  exports: Record<string, string>;
};

describe("@stackra/oxlint-config presets", () => {
  for (const [subpath, file] of Object.entries(pkg.exports)) {
    it(`${subpath} → ${file} exists`, () => {
      expect(existsSync(join(root, file))).toBe(true);
    });
  }

  it("base.jsonc loads every JS plugin from a source file that exists", () => {
    const text = readFileSync(join(root, "src", "base.jsonc"), "utf8");
    const plugins = /"jsPlugins":\s*\[([^\]]*)\]/.exec(text)?.[1] ?? "";
    const paths = [...plugins.matchAll(/"([^"]+)"/g)].map((match) => match[1] ?? "");
    expect(paths).toHaveLength(2);
    for (const path of paths) expect(existsSync(join(root, "src", path))).toBe(true);
    expect(text).toContain('"feature-flags/no-plan-targeting": "error"');
  });

  it("base.jsonc turns on every rule @stackra/coding-standard registers, at error", () => {
    const text = readFileSync(join(root, "src", "base.jsonc"), "utf8");
    const plugin = readFileSync(
      join(
        root,
        "..",
        "..",
        "developer",
        "coding-standard",
        "src",
        "core",
        "constants",
        "stackra-plugin.constant.ts",
      ),
      "utf8",
    );
    const registered = [...plugin.matchAll(/^ {4}"([a-z-]+)": [A-Z_]+_RULE,$/gm)].map(
      (match) => match[1],
    );
    const enabled = [...text.matchAll(/"stackra\/([a-z-]+)": "error"/g)].map((match) => match[1]);
    expect(registered.length).toBeGreaterThan(0);
    expect([...enabled].sort()).toEqual([...registered].sort());
  });

  it("package.json names @stackra/coding-standard as a peer, so a consumer installs the plugin", () => {
    const manifest = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as {
      peerDependencies?: Record<string, string>;
    };
    expect(manifest.peerDependencies?.["@stackra/coding-standard"]).toBeDefined();
  });

  it("boundaries.jsonc keeps the tier rule", () => {
    const text = readFileSync(join(root, "src", "boundaries.jsonc"), "utf8");
    expect(text).toContain('"**/apps/**"');
    expect(text).toContain('"@stackra/*/src/*"');
  });

  it("base.jsonc carries the rule-gap cheap set at error (stackra-229)", () => {
    const text = readFileSync(join(root, "src", "base.jsonc"), "utf8");
    for (const rule of [
      "no-console",
      "typescript/prefer-ts-expect-error",
      "array-callback-return",
      "no-fallthrough",
      "no-loop-func",
      "oxc/no-accumulating-spread",
      "typescript/no-dynamic-delete",
      "typescript/prefer-for-of",
      "prefer-const",
      "import/no-duplicates",
      "unicorn/prefer-set-has",
      "unicorn/consistent-date-clone",
      "react/rules-of-hooks",
      "react/jsx-no-target-blank",
      "react/button-has-type",
      "react/no-array-index-key",
    ])
      expect(text).toContain(`"${rule}": "error"`);
    expect(text).toContain('"typescript/ban-ts-comment"');
    expect(text).toContain('"ts-ignore": true');
    expect(text).toContain('"ts-expect-error": true');
    expect(text).toContain('"ts-expect-error": "allow-with-description"');
    expect(text).toContain('"plugins": ["react", "jsx-a11y"]');
    expect(text).toContain('"**/tools/scripts/*.mjs"');
  });

  it("base.jsonc leaves no rule at warn and carries B-1, B-2 and B-5 at error (stackra-230)", () => {
    const text = readFileSync(join(root, "src", "base.jsonc"), "utf8");
    expect(text).toContain('"categories": { "correctness": "error", "suspicious": "error" }');
    for (const preset of ["base", "node", "boundaries", "decorators", "react"])
      expect(readFileSync(join(root, "src", `${preset}.jsonc`), "utf8")).not.toMatch(/"warn"/);
    expect(text).toContain(
      '"unicorn/no-array-sort": ["error", { "allowExpressionStatement": true }]',
    );
    for (const rule of [
      "react/exhaustive-deps",
      "no-promise-executor-return",
      "unicorn/prefer-code-point",
      "unicorn/prefer-structured-clone",
      "unicorn/prefer-spread",
    ])
      expect(text).toContain(`"${rule}": "error"`);
  });

  it("base.jsonc carries the B-3 autofix sweep at error and keeps number-literal-case off (stackra-231)", () => {
    const text = readFileSync(join(root, "src", "base.jsonc"), "utf8");
    for (const rule of [
      "unicorn/numeric-separators-style",
      "unicorn/switch-case-braces",
      "unicorn/prefer-string-replace-all",
      "unicorn/catch-error-name",
    ])
      expect(text).toContain(`"${rule}": "error"`);
    // oxfmt prints hex digits lowercase, so the rule's uppercase demand would fight the formatter.
    expect(text).toContain('"unicorn/number-literal-case": "off"');
  });

  it("base.jsonc requires property signatures, closing the port bivariance hole (B-4, stackra-232)", () => {
    const text = readFileSync(join(root, "src", "base.jsonc"), "utf8");
    expect(text).toContain('"typescript/method-signature-style": ["error", "property"]');
  });

  it("base.jsonc carries the B-6 React hygiene and B-8 JSX literal rules (stackra-233)", () => {
    const text = readFileSync(join(root, "src", "base.jsonc"), "utf8");
    expect(text).toContain('"eqeqeq": ["error", "smart"]');
    expect(text).toContain('"no-param-reassign": ["error", { "props": true }]');
    for (const rule of ["react/display-name", "react/only-export-components"])
      expect(text).toContain(`"${rule}": "error"`);
    expect(text).toMatch(/"react\/jsx-no-literals": \[\s*"error",\s*\{\s*"ignoreProps": true/);
    // Tests, stories and e2e specs render fixture text and anonymous stand-ins.
    expect(text).toContain(
      '"rules": { "react/jsx-no-literals": "off", "react/display-name": "off" }',
    );
    // Decided off by class: status live regions, React Native views and house components have no tag to prefer.
    expect(text).toContain('"jsx-a11y/prefer-tag-over-role": "off"');
  });

  it("base.jsonc requires explicit module boundary types in packages, not apps or tests (B-7, stackra-234)", () => {
    const text = readFileSync(join(root, "src", "base.jsonc"), "utf8");
    expect(text).toContain('"typescript/explicit-module-boundary-types": "error"');
    expect(text).toContain('"rules": { "typescript/explicit-module-boundary-types": "off" }');
    const override =
      /"files": \[([^\]]*)\],\s*"rules": \{ "typescript\/explicit-module-boundary-types": "off" \}/.exec(
        text,
      )?.[1];
    for (const glob of [
      "**/apps/**",
      "**/workers/**",
      "**/tools/**",
      "**/__tests__/**",
      "**/*.test.*",
    ])
      expect(override).toContain(`"${glob}"`);
    expect(override).not.toContain('"**/packages/**"');
  });
});
