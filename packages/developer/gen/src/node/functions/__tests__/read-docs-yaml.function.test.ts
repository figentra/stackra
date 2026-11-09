/**
 * Stackra file contract:
 * Purpose: unit tests of `readDocsYaml`: every setting read with the docs app's defaults, and each refusal
 *          (`docs_config_invalid`, `file: "docs.yaml"`): a missing file, YAML that does not parse, a document that is
 *          not a mapping, `theme` and `navigation`, an unknown key, a missing required key and a value of the wrong
 *          shape; and the shipped `schema/docs.json`: a byte copy of the canonical `tools/schemas/docs.schema.json`,
 *          with the `$id` the static Worker serves and exactly the keys `readDocsYaml` reads.
 * Boundary: test only; writes docs.yaml files under `<gen>/.cache/fixtures/`, reads the two schema files.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0514 (amendment of 2026-11-09: the docs member and docs.yaml);
 *                     ADR 0284 (the static Worker serves the schemas).
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "@stackra/testing";

import { readDocsYaml } from "#node/functions/read-docs-yaml.function";

/** The gen package root. */
const GEN_ROOT = fileURLToPath(new URL("../../../../", import.meta.url));

let written = 0;

/** A member whose docs.yaml is `text`, or has none when `text` is undefined. */
function writeMember(text: string | undefined): string {
  written += 1;
  const root = join(GEN_ROOT, ".cache", "fixtures", `read-docs-yaml-${process.pid}-${written}`);
  rmSync(root, { recursive: true, force: true });
  mkdirSync(root, { recursive: true });
  if (text !== undefined) writeFileSync(join(root, "docs.yaml"), text);
  return root;
}

/** The refusals of `text`, as `[subject, fix]`. */
const refusals = (text: string | undefined) =>
  readDocsYaml(writeMember(text)).errors.map((error) => {
    expect([error.code, error.file]).toEqual(["docs_config_invalid", "docs.yaml"]);
    return error.subject;
  });

describe("readDocsYaml", () => {
  it("reads every setting, with the docs app's defaults", () => {
    const { config, errors } = readDocsYaml(
      writeMember(
        [
          "$schema: https://static.stackra.figentra.com/schemas/docs.json",
          "name: Acme",
          "description: The Acme docs.",
          "colors:",
          '  primary: "#0B0D0F"',
          '  light: "#FFFFFF"',
          "logo:",
          "  light: logo/light.svg",
          "  dark: logo/dark.svg",
          "favicon: favicon.svg",
          "navbar:",
          "  links:",
          "    - label: GitHub",
          "      href: https://github.com/acme",
          "  primary:",
          "    label: Start",
          "    href: /quickstart",
          "footer:",
          "  socials:",
          "    x: https://x.com/acme",
          "  links:",
          "    - header: Product",
          "      items:",
          "        - label: Pricing",
          "          href: /pricing",
          "apiReference:",
          "  - payments",
          "locales:",
          "  - code: en",
          "    label: English",
          "    default: true",
          "redirects:",
          "  - from: /old",
          "    to: /quickstart",
          "raw:",
          "  searchToggle:",
          "    enabled: true",
          "",
        ].join("\n"),
      ),
    );
    expect(errors).toEqual([]);
    expect(config).toEqual({
      name: "Acme",
      description: "The Acme docs.",
      colors: { primary: "#0B0D0F", light: "#FFFFFF" },
      logo: { light: "logo/light.svg", dark: "logo/dark.svg" },
      favicon: "favicon.svg",
      navbar: {
        links: [{ label: "GitHub", href: "https://github.com/acme" }],
        primary: { label: "Start", href: "/quickstart" },
      },
      footer: {
        socials: { x: "https://x.com/acme" },
        links: [{ header: "Product", items: [{ label: "Pricing", href: "/pricing" }] }],
      },
      apiReference: ["payments"],
      locales: [{ code: "en", label: "English", default: true }],
      redirects: [{ from: "/old", to: "/quickstart" }],
      raw: { searchToggle: { enabled: true } },
    });

    expect(readDocsYaml(writeMember('name: Acme\ncolors:\n  primary: "#000"\n')).config).toEqual({
      name: "Acme",
      colors: { primary: "#000" },
      apiReference: [],
      redirects: [],
      raw: {},
    });
  });

  it("refuses a missing file, broken YAML and a document that is not a mapping", () => {
    expect(refusals(undefined)).toEqual(["docs.yaml"]);
    expect(refusals("name: [unclosed\n")).toEqual(["docs.yaml"]);
    expect(refusals("- name\n")).toEqual(["docs.yaml"]);
    expect(refusals("")).toEqual(["docs.yaml"]);
  });

  it("refuses theme and navigation, an unknown key, a missing key and a wrong shape, all at once", () => {
    const { errors } = readDocsYaml(
      writeMember(
        [
          "name: 3",
          "colors:",
          "  light: '#fff'",
          "theme: mint",
          "navigation: []",
          "sidebar: true",
          "locales:",
          "  - code: ar",
          "    label: العربية",
          "    dir: down",
          "redirects:",
          "  - from: /a",
          "",
        ].join("\n"),
      ),
    );
    expect(errors.map((error) => error.subject)).toEqual([
      "name",
      "colors.primary",
      "theme",
      "navigation",
      "sidebar",
      "locales[0].dir",
      "redirects[0].to",
    ]);
    expect(errors.find((error) => error.subject === "navigation")?.fix).toContain(
      "content/**/meta.json",
    );
    expect(errors.find((error) => error.subject === "theme")?.fix).toContain("Fumadocs");
  });
});

describe("schema/docs.json", () => {
  const shipped = readFileSync(new URL("../../../../schema/docs.json", import.meta.url), "utf8");
  const canonical = readFileSync(
    new URL("../../../../../../../tools/schemas/docs.schema.json", import.meta.url),
    "utf8",
  );
  const schema = JSON.parse(shipped) as {
    readonly $id: string;
    readonly required: readonly string[];
    readonly properties: Readonly<Record<string, unknown>>;
  };

  it("is a byte copy of tools/schemas/docs.schema.json (cp the canonical file over it)", () => {
    expect(shipped).toBe(canonical);
  });

  it("has the served $id and exactly the keys readDocsYaml reads", () => {
    expect(schema.$id).toBe("https://static.stackra.figentra.com/schemas/docs.json");
    expect(schema.required).toEqual(["name", "colors"]);
    expect(Object.keys(schema.properties)).toEqual([
      "$schema",
      "name",
      "description",
      "colors",
      "logo",
      "favicon",
      "navbar",
      "footer",
      "apiReference",
      "locales",
      "redirects",
      "raw",
    ]);
  });
});
