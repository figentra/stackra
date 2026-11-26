/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./react/session` entry: `useSession` and `SessionGate` are its values, and
 *          nothing it loads at run time reaches `@stackra/ui` or a UI library, so a lean app can import it (STA-2832).
 * Boundary: test only; imports the stand-in barrel through its `#react` alias and reads the package's own sources to
 *           follow its value imports (a type-only import loads nothing and is skipped).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import type { SessionUser } from "#contracts/index";
import type { SessionGateProps as ReactSessionGateProps } from "#react/index";
import * as session from "#react/session/index";
import type { SessionGateProps, SessionValue, SignedInSession } from "#react/session/index";

/** The package's `src/`, three folders above this test's folder. */
const SRC = fileURLToPath(new URL("../../../", import.meta.url));

/** The packages a lean app does not install: `@stackra/ui` and the UI libraries its React entry loads. */
const UI =
  /^(?:@stackra\/ui(?:\/|$)|@heroui\/react|react-aria|recharts|motion|framer-motion|lucide-react|react-hook-form|@tiptap\/)/u;

/** A value import or re-export (`import { x } from`, `export { x } from`, `import "x"`); never `import type`. */
const VALUE_IMPORT = /^\s*(?:import|export)\s+(?!type\b)(?:[^;"]*?\s+from\s+)?"([^"]+)"/gmu;

/** The source file `#folder/rest` names, in the order of the package's `imports` map. */
function resolve(specifier: string): string {
  const path = `${SRC}${specifier.slice(1)}`;
  const file = [`${path}.ts`, `${path}.tsx`, `${path}/index.ts`, path].find(
    (candidate) => /\.tsx?$/u.test(candidate) && existsSync(candidate),
  );
  if (file === undefined) throw new Error(`unresolved ${specifier}`);
  return file;
}

/** Every package the entry `start` loads at run time, following the package's own `#` imports. */
function externals(start: string): readonly string[] {
  const seen = new Set<string>();
  const found = new Set<string>();
  const queue = [resolve(start)];
  for (let file = queue.pop(); file !== undefined; file = queue.pop()) {
    if (seen.has(file)) continue;
    seen.add(file);
    for (const [, specifier = ""] of readFileSync(file, "utf8").matchAll(VALUE_IMPORT)) {
      if (specifier.startsWith("#")) queue.push(resolve(specifier));
      else found.add(specifier);
    }
  }
  return [...found];
}

describe("@stackra/identity/react/session", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(session).sort()).toEqual(["SessionGate", "useSession"]);
  });

  it("types the session as the ./react entry does", () => {
    expectTypeOf<SignedInSession["user"]>().toEqualTypeOf<SessionUser>();
    expectTypeOf<SessionValue["user"]>().toEqualTypeOf<SessionUser | null>();
    expectTypeOf<SessionGateProps>().toEqualTypeOf<ReactSessionGateProps>();
  });

  it("loads no @stackra/ui and no UI library, where ./react does", () => {
    const lean = externals("#react/session/index");
    expect(lean.filter((name) => UI.test(name))).toEqual([]);
    expect(lean).toContain("react");
    // The same walk finds the kit's UI behind `./react`, so the check above is not vacuous.
    expect(externals("#react/index").some((name) => UI.test(name))).toBe(true);
  });
});
