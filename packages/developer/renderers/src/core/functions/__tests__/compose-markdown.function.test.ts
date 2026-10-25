/**
 * Stackra file contract:
 * Purpose: unit tests of `composeMarkdown`: frontmatter from a mapping or raw lines, none at all, undefined keys left
 *          out, no line folding, and the body trimmed to end in one newline.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0282 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { composeMarkdown } from "#core/functions/compose-markdown.function";

describe("composeMarkdown", () => {
  it("writes a mapping as YAML frontmatter, then the comment and the body", () => {
    expect(
      composeMarkdown({ name: "naming", description: "Name things" }, "<!-- c -->", "# Naming\n"),
    ).toBe("---\nname: naming\ndescription: Name things\n---\n\n<!-- c -->\n\n# Naming\n");
  });

  it("leaves out keys whose value is undefined", () => {
    expect(
      composeMarkdown({ description: "Run it", "argument-hint": undefined }, "<!-- c -->", "Go"),
    ).toBe("---\ndescription: Run it\n---\n\n<!-- c -->\n\nGo\n");
  });

  it("never folds a long value over two lines", () => {
    const description = "word ".repeat(40).trim();
    expect(composeMarkdown({ description }, "<!-- c -->", "x")).toContain(
      `description: ${description}\n`,
    );
  });

  it("takes a string as YAML lines already written", () => {
    expect(composeMarkdown("globs: src/**/*.ts", "<!-- c -->", "x")).toBe(
      "---\nglobs: src/**/*.ts\n---\n\n<!-- c -->\n\nx\n",
    );
  });

  it("writes no frontmatter for undefined", () => {
    expect(composeMarkdown(undefined, "<!-- c -->", "\n\n# Title\n\n\n")).toBe(
      "<!-- c -->\n\n# Title\n",
    );
  });
});
