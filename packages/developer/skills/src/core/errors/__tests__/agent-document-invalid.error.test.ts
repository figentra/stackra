/**
 * Stackra file contract:
 * Purpose: unit tests of `AgentDocumentInvalidError`: names the source and every issue path in its message, keeps a
 *          frozen copy of the issues, and is a plain `Error` with its own name.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0282 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { AgentDocumentInvalidError } from "#core/errors/agent-document-invalid.error";

describe("AgentDocumentInvalidError", () => {
  it("names the source and each path", () => {
    const issues = [
      { path: "title", message: "Required" },
      { path: "", message: "Must open with a frontmatter block" },
    ];
    const error = new AgentDocumentInvalidError("rules/naming.md", issues);

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("AgentDocumentInvalidError");
    expect(error.source).toBe("rules/naming.md");
    expect(error.message).toBe(
      "rules/naming.md is invalid: title: Required; (document): Must open with a frontmatter block",
    );
    expect(error.issues).toEqual(issues);
    expect(Object.isFrozen(error.issues)).toBe(true);

    issues.pop();
    expect(error.issues).toHaveLength(2);
  });
});
