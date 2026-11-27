/**
 * Stackra file contract:
 * Purpose: unit tests of `checkSubmodules`: no `.gitmodules` passes; an undeclared submodule (the private notes case,
 *          STA-2918), a declared one with an ssh, local or credential-carrying URL and a stale declaration are each
 *          one finding; a declared https or relative submodule passes, and a finding never echoes a credential.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0526 (decision 4); ADR 0022 (test placement).
 */
import { describe, expect, it } from "@stackra/testing";

import { checkSubmodules } from "#node/functions/check-submodules.function";

/** A `.gitmodules` text with one submodule at `path` fetched from `url`. */
const one = (path: string, url: string): string =>
  `[submodule "${path}"]\n\tpath = ${path}\n\turl = ${url}\n`;

describe("checkSubmodules", () => {
  it("accepts a repository without .gitmodules or with an empty one", () => {
    expect(checkSubmodules(undefined)).toEqual([]);
    expect(checkSubmodules("")).toEqual([]);
  });

  it("refuses an undeclared submodule, such as a private notes repository", () => {
    const findings = checkSubmodules(one(".notes", "https://github.com/example/private-notes.git"));
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatch(
      /^\.gitmodules: submodule \.notes .* is not declared; `git clone --recursive`/,
    );
    expect(findings[0]).toMatch(/stackra\.layout\.submodules/);
  });

  it("refuses a declaration with an empty reason", () => {
    expect(
      checkSubmodules(one("vendor", "https://example.com/v.git"), { vendor: " " }),
    ).toHaveLength(1);
  });

  it("accepts a declared submodule an anonymous clone can fetch", () => {
    const declared = { vendor: "the public upstream, cloned anonymously" };
    expect(checkSubmodules(one("vendor", "https://example.com/v.git"), declared)).toEqual([]);
    expect(checkSubmodules(one("vendor", "../vendor.git"), declared)).toEqual([]);
  });

  it("refuses a declared submodule behind ssh, a local path, no url or a credential", () => {
    const declared = { vendor: "public" };
    for (const url of [
      "git@github.com:example/v.git",
      "ssh://git@example.com/v.git",
      "git+ssh://example.com/v.git",
      "file:///srv/v.git",
      "/srv/v.git",
      "~/v.git",
      "https://user:secret-value@example.com/v.git",
    ])
      expect(checkSubmodules(one("vendor", url), declared), url).toHaveLength(1);
    expect(checkSubmodules('[submodule "vendor"]\n\tpath = vendor\n', declared)).toHaveLength(1);
  });

  it("never prints the credential of a URL", () => {
    const text = one("vendor", "https://user:secret-value@example.com/v.git");
    const findings = [...checkSubmodules(text), ...checkSubmodules(text, { vendor: "public" })];
    expect(findings).toHaveLength(2);
    for (const finding of findings) {
      expect(finding).not.toMatch(/secret-value/);
      expect(finding).toMatch(/https:\/\/\*\*\*@example\.com/);
    }
  });

  it("reports a declaration with no submodule behind it", () => {
    expect(checkSubmodules(undefined, { gone: "was public" })).toEqual([
      "package.json: stackra.layout.submodules declares gone, but .gitmodules has no such submodule; remove the declaration (ADR 0526 d4)",
    ]);
  });
});
