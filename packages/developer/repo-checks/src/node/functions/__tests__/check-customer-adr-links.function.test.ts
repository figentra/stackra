/**
 * Stackra file contract:
 * Purpose: unit tests of `checkCustomerAdrLinks`: a customer page linking accepted and proposed ADRs passes; a link to
 *          a superseded or rejected ADR, or to no ADR page, is a finding with its line; other pages and bare
 *          "ADR NNNN" mentions are not read.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: STA-2851; ADR 0022 (test placement).
 */
import { describe, expect, it } from "@stackra/testing";

import { checkCustomerAdrLinks } from "#node/functions/check-customer-adr-links.function";

const ADR = "apps/docs/src/docs/adr/";
const SUPPORT = "apps/docs/src/docs/customers/support.mdx";

/** An ADR page whose description states `status`. */
const page = (name: string, status: string) => ({
  path: `${ADR}${name}.mdx`,
  text: `---\ntitle: "${name}"\ndescription: "${status} · 2026-10-19"\n---\n`,
});

const ADRS = [
  page("0013-versioning", "Superseded by 0025, rule 6 amended by 0468"),
  page("0177-distribution", "Accepted, amended by 0453"),
  page("0402-residency", "Proposed"),
  page("0011-rejected-idea", "Rejected"),
];

describe("checkCustomerAdrLinks", () => {
  it("accepts links to decisions in force and ignores mentions and other pages", () => {
    const support = {
      path: SUPPORT,
      text: "{/* Governing contract: ADR 0013. */}\n\nSee [0177](/adr/0177-distribution#decision-6) and [0402](/adr/0402-residency).\n",
    };
    const runbook = {
      path: "apps/docs/src/docs/runbooks/release.mdx",
      text: "[0013](/adr/0013-versioning)\n",
    };
    expect(checkCustomerAdrLinks([...ADRS, support, runbook])).toEqual([]);
  });

  it("reports a link to a superseded or rejected ADR and to no ADR page, with its line", () => {
    const support = {
      path: SUPPORT,
      text: "# Support\n\nA note ([0013](/adr/0013-versioning) decision 5).\nSee [0011](/adr/0011-rejected-idea), [0999](/adr/0999-ghost).\n",
    };
    expect(checkCustomerAdrLinks([...ADRS, support])).toEqual([
      `${SUPPORT}:3: links ADR 0013, which is superseded by 0025; a customer page cites only decisions in force`,
      `${SUPPORT}:4: links ADR 0011, which is rejected; a customer page cites only decisions in force`,
      `${SUPPORT}:4: links /adr/0999-ghost, which is no ADR page`,
    ]);
  });
});
