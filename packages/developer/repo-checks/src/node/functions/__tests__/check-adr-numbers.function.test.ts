/**
 * Stackra file contract:
 * Purpose: unit tests of `checkAdrNumbers`: a registered page passes and a repository without the register is not
 *          checked; an unregistered number, a different slug, a number used by two files and a number registered twice
 *          are findings; other files are ignored.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: STA-1732; ADR 0022 (test placement).
 */
import { describe, expect, it } from "@stackra/testing";

import { checkAdrNumbers } from "#node/functions/check-adr-numbers.function";

const ADR = "apps/docs/src/docs/adr/";
const REGISTER =
  '"0001":\n  slug: first\n  status: accepted\n"0002":\n  slug: second\n  status: reserved\n';

describe("checkAdrNumbers", () => {
  it("accepts registered pages and ignores other files", () => {
    expect(
      checkAdrNumbers([`${ADR}0001-first.mdx`, `${ADR}index.mdx`, `${ADR}numbers.yaml`], REGISTER),
    ).toEqual([]);
    expect(checkAdrNumbers([`${ADR}0001-first.mdx`], undefined)).toEqual([]);
  });

  it("reports an unregistered number and a different slug", () => {
    expect(checkAdrNumbers([`${ADR}0003-third.mdx`], REGISTER)).toEqual([
      `${ADR}0003-third.mdx: ADR number 0003 is not in numbers.yaml (pnpm adr:reserve)`,
    ]);
    expect(checkAdrNumbers([`${ADR}0002-other.mdx`], REGISTER)).toEqual([
      `${ADR}0002-other.mdx: numbers.yaml registers 0002 as "second", not "other"`,
    ]);
  });

  it("reports a number used by two files or registered twice", () => {
    const twice = checkAdrNumbers([`${ADR}0001-first.mdx`, `${ADR}0001-other.mdx`], REGISTER);
    expect(twice.some((finding) => finding.includes("is also used by"))).toBe(true);
    expect(
      checkAdrNumbers([`${ADR}0001-first.mdx`], `${REGISTER}"0001":\n  slug: again\n`),
    ).toHaveLength(1);
  });
});
