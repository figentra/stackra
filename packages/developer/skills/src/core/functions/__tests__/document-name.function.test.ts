/**
 * Stackra file contract:
 * Purpose: unit tests of `documentName`: a skill's name from its folder, other kinds from the file name, either path
 *          separator, and the issues for a wrong file and a name that is not kebab-case.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0282 (decision 2); ADR 0294 (decision 20).
 */
import { describe, expect, it } from "@stackra/testing";

import { documentName } from "#core/functions/document-name.function";

describe("documentName", () => {
  it("names a skill by its folder", () => {
    expect(documentName("skill", "assets/skills/backend-errors/SKILL.md")).toEqual({
      name: "backend-errors",
    });
    expect(documentName("skill", "C:\\kit\\skills\\tdd\\SKILL.md")).toEqual({ name: "tdd" });
  });

  it("names the other kinds by the file name", () => {
    expect(documentName("rule", "rules/naming-and-casing.md")).toEqual({
      name: "naming-and-casing",
    });
    expect(documentName("hook", "guard-bash.md")).toEqual({ name: "guard-bash" });
  });

  it("refuses a skill file that is not SKILL.md", () => {
    expect(documentName("skill", "skills/tdd/README.md")).toEqual({
      issue: { path: "", message: "A skill is a `SKILL.md` file inside a folder named after it" },
    });
  });

  it("refuses a file that is not Markdown", () => {
    expect(documentName("rule", "rules/naming.txt")).toEqual({
      issue: { path: "", message: "An agent document is a `.md` file" },
    });
  });

  it.each(["Naming", "naming_and_casing", "2fa", "a--b", ""])("refuses the name %j", (name) => {
    expect(documentName("command", `commands/${name}.md`)).toEqual({
      issue: { path: "name", message: `"${name}" is not a kebab-case name` },
    });
  });

  it("refuses a SKILL.md with no folder", () => {
    expect(documentName("skill", "SKILL.md")).toEqual({
      issue: { path: "name", message: '"" is not a kebab-case name' },
    });
  });
});
