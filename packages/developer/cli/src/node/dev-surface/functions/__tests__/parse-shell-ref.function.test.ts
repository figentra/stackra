/**
 * Stackra file contract:
 * Purpose: unit tests of `parseShellRef`: `<owner>/<name>@<major>` parses, anything else is a usage error.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0436 (decision 4).
 */
import { describe, expect, it } from "@stackra/testing";

import { parseShellRef } from "#node/dev-surface/functions/parse-shell-ref.function";
import { CliUsageError } from "#node/errors/cli-usage.error";

describe("parseShellRef", () => {
  it("parses owner, name and line", () => {
    expect(parseShellRef("os/console@3")).toEqual({ owner: "os", name: "console", line: 3 });
    expect(parseShellRef("commerce/till@1")).toEqual({ owner: "commerce", name: "till", line: 1 });
  });

  it("refuses a reference without a line or with unsafe segments", () => {
    for (const bad of ["os/console", "console@3", "os/../x@3", "OS/console@3", "os/console@3.1"]) {
      expect(() => parseShellRef(bad)).toThrow(CliUsageError);
    }
  });
});
