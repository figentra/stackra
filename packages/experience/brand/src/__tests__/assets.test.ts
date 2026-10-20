import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { colors } from "..";

const assets = fileURLToPath(new URL("../../assets/", import.meta.url));
const read = (path: string) => readFileSync(assets + path, "utf8");
const kebab = (name: string) => name.replace(/([a-z])([A-Z0-9])/g, "$1-$2").toLowerCase();

interface Resolved {
  tokens: {
    name: string;
    light: { value: string; hex: string };
    dark: { value: string; hex: string };
  }[];
}

// @covers sta-173:FR-001 sta-173:FR-002 sta-173:P-001 sta-173:P-002
describe("@stackra/brand assets", () => {
  it("the TS colours match the kit's resolved Stackra tokens", () => {
    const resolved = (JSON.parse(read("tokens/resolved.json")) as Resolved).tokens;
    const byName = new Map(Object.entries(colors).map(([name, token]) => [kebab(name), token]));
    for (const token of resolved) {
      const ours = byName.get(token.name);
      expect(ours, token.name).toBeDefined();
      expect([ours?.light, ours?.dark, ours?.hexLight, ours?.hexDark], token.name).toEqual([
        token.light.value,
        token.dark.value,
        token.light.hex,
        token.dark.hex,
      ]);
    }
  });

  it("every TS colour is a custom property in the HeroUI web theme", () => {
    const css = read("heroui/web.css");
    for (const name of Object.keys(colors)) expect(css, name).toContain(`--${kebab(name)}:`);
  });

  it("every @font-face file exists beside its OFL licence", () => {
    const css = read("public/fonts/fonts.css");
    const files = [...css.matchAll(/url\("\.\/([^"]+)"\)/g)].map((m) => m[1]);
    expect(files).toHaveLength(10);
    for (const file of files) expect(existsSync(`${assets}public/fonts/${file}`), file).toBe(true);
    for (const licence of ["OFL-Geist.txt", "OFL-IBMPlexSansArabic.txt"])
      expect(existsSync(`${assets}public/fonts/${licence}`), licence).toBe(true);
  });

  it("the brand assets carry their all-rights-reserved NOTICE (ADR 0024)", () => {
    expect(read("NOTICE")).toContain("NOT covered by the MIT licence");
  });
});
