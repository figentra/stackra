/**
 * Stackra file contract:
 * Purpose: unit tests of `splitFrontMatter`: the mapping and body of a well-formed document (LF, CRLF, BOM), and the
 *          refusals for a missing or unclosed fence, bad YAML, duplicate keys and a non-mapping.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0282 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { AgentDocumentInvalidError } from "#core/errors/agent-document-invalid.error";
import { splitFrontMatter } from "#core/functions/split-front-matter.function";

describe("splitFrontMatter", () => {
  it("returns the mapping and the body without its leading blank lines", () => {
    expect(
      splitFrontMatter("---\ndescription: Name things\n---\n\n# Naming\n\nText\n", "a.md"),
    ).toEqual({
      data: { description: "Name things" },
      body: "# Naming\n\nText\n",
    });
  });

  it("reads CRLF line endings and a byte order mark", () => {
    expect(
      splitFrontMatter(
        `${String.fromCodePoint(0xfe_ff)}---\r\nalways: true\r\n---\r\nBody`,
        "a.md",
      ),
    ).toEqual({
      data: { always: true },
      body: "Body",
    });
  });

  it("keeps a later --- line in the body", () => {
    expect(splitFrontMatter("---\na: 1\n---\nOne\n---\nTwo", "a.md").body).toBe("One\n---\nTwo");
  });

  it.each([
    ["no fence", "# Title\n", "Must open with a frontmatter block between two `---` lines"],
    [
      "an unclosed fence",
      "---\na: 1\n",
      "Must open with a frontmatter block between two `---` lines",
    ],
    ["a list", "---\n- a\n---\n", "Frontmatter must be a mapping"],
    ["an empty block", "---\n---\nBody", "Frontmatter must be a mapping"],
  ])("refuses %s", (_, text, message) => {
    expect(() => splitFrontMatter(text, "a.md")).toThrow(
      new AgentDocumentInvalidError("a.md", [{ path: "", message }]),
    );
  });

  it("refuses YAML that does not parse, duplicate keys included", () => {
    for (const text of ["---\na: [1\n---\n", "---\na: 1\na: 2\n---\n"]) {
      expect(() => splitFrontMatter(text, "a.md")).toThrow(
        /a\.md is invalid: \(document\): Frontmatter is not YAML/,
      );
    }
  });
});
