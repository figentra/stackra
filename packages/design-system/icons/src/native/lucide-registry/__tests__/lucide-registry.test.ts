/**
 * Stackra file contract:
 * Purpose: proves the generated native files (the registry and the re-exports) name exactly the `LucideIconName` list
 *          and only export names the installed lucide-react-native declares, without loading React Native.
 * Boundary: reads the committed generated text and the installed package's main file as text; React Native does not
 *          run in vitest, so the components themselves are not imported.
 * Runtime: node
 * Governing contract: ADR 0303 (decision 10); ADR 0183 (budgets: the full map is opt-in); ADR 0022.
 */
// @covers sta-350:FR-048 sta-350:FR-051
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

import { LucideIconName } from "#contracts/enums/lucide-icon-name.enum";

const require = createRequire(import.meta.url);
const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

const registry = read("../lucide-registry.ts");
const reexports = read("../../lucide-icons/lucide-icons.ts");
const main = readFileSync(
  join(dirname(dirname(require.resolve("lucide-react-native"))), "esm", "lucide-react-native.mjs"),
  "utf8",
);

/** The component name each registry key points at, by key. */
const entries = [...registry.matchAll(/^ {2}"?([a-z0-9-]+)"?: lucide\.(\w+),$/gm)].map(
  ([, key, component]) => [key, component] as const,
);
const exported = [...reexports.matchAll(/^ {2}(\w+),$/gm)].map(([, name]) => name);
const declared = new Set([...main.matchAll(/default as (\w+)/g)].map(([, name]) => name));

describe("the native Lucide files", () => {
  it("register exactly the Lucide names", () => {
    expect(entries.map(([key]) => key)).toEqual([...LucideIconName]);
  });

  it("re-export the component each registry key points at, once", () => {
    expect(new Set(exported).size).toBe(exported.length);
    expect(exported).toEqual(entries.map(([, component]) => component));
  });

  it("export only names lucide-react-native declares", () => {
    expect(exported.filter((name) => !declared.has(name))).toEqual([]);
  });
});
