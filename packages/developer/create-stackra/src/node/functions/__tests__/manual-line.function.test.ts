/**
 * Stackra file contract:
 * Purpose: unit tests of `manualLine` and `npxArguments`: the line a developer pastes is the same run, each argument
 *          that a shell would split or expand is quoted.
 * Boundary: pure functions under test.
 * Runtime: node
 * Governing contract: ADR 0199 (amendment of 2026-11-27); ADR 0022 (test placement).
 */
import { manualLine } from "#node/functions/manual-line.function";
import { npxArguments } from "#node/functions/npx-arguments.function";

describe("manualLine", () => {
  it("is npx with the same arguments the run uses", () => {
    expect(npxArguments("https://r.test/", "next", ["my-app"])).toEqual([
      "--yes",
      "--@stackra:registry=https://r.test/",
      "@stackra/cli@next",
      "create",
      "my-app",
    ]);
    expect(manualLine("https://r.test/", "next", ["my-app", "--scope", "@acme"])).toBe(
      "npx --yes --@stackra:registry=https://r.test/ @stackra/cli@next create my-app --scope @acme",
    );
  });

  it("quotes an argument a shell would split or expand", () => {
    expect(manualLine("https://r.test/", "latest", ["it's mine", "$HOME"])).toBe(
      `npx --yes --@stackra:registry=https://r.test/ @stackra/cli@latest create 'it'\\''s mine' '$HOME'`,
    );
  });
});
