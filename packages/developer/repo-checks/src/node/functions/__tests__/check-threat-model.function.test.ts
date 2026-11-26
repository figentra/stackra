/**
 * Stackra file contract:
 * Purpose: unit tests of `checkThreatModel`, `checkThreatModelIndex` and `needsThreatModel`: a complete model passes;
 *          a missing file, a missing ASVS or review line, a missing, misordered or empty section, a wrong header, an
 *          unknown class and an uncontrolled threat with no issue key are each a finding; the platform page must link
 *          every required member; the security folder and the listed members need a model.
 * Boundary: test only; pure functions, no disk.
 * Runtime: node (vitest)
 * Governing contract: constitution SEC10; ADR 0207 (amendment of 2026-11-26); ADR 0022 (test placement); STA-316.
 */
import { describe, expect, it } from "@stackra/testing";

import { THREAT_MODEL } from "#node/constants/threat-model.constant";
import { checkThreatModel } from "#node/functions/check-threat-model.function";
import { checkThreatModelIndex } from "#node/functions/check-threat-model-index.function";
import { needsThreatModel } from "#node/functions/needs-threat-model.function";

const PATH = "packages/security/demo/docs/threat-model.md";

/** A complete threat model; each test breaks one part of it. */
const MODEL = [
  "# Threat model: @stackra/demo",
  "",
  "ASVS level: L2 (V2, V3, V4); L1 for every other chapter.",
  "Reviewed: 2026-11-26 (STA-316).",
  "",
  "## Assets",
  "",
  "| Asset | Where it lives | Class |",
  "| ----- | -------------- | ----- |",
  "| Session cookie | the browser | `secret` |",
  "| Tenant name | `tenants.name` | confidential |",
  "",
  "## Trust boundaries",
  "",
  "1. Client to API: the bearer token.",
  "2. API to Postgres: row-level security.",
  "",
  "## Threats and controls",
  "",
  "| Threat | Control today | Open work |",
  "| ------ | ------------- | --------- |",
  "| A forged cookie | AES-GCM sealed under `cookieKey` | — |",
  "| A replayed request | None | STA-2803 |",
  "",
].join("\n");

describe("checkThreatModel", () => {
  it("accepts a complete model", () => {
    expect(checkThreatModel(PATH, MODEL)).toEqual([]);
  });

  it("reports a missing file", () => {
    expect(checkThreatModel(PATH, undefined)).toEqual([
      `${PATH}: missing; a security-relevant member keeps a threat model (constitution SEC10)`,
    ]);
  });

  it("asks for the ASVS level and the review date", () => {
    const bare = MODEL.replace(/^ASVS level: .*$/m, "").replace(/^Reviewed: .*$/m, "");
    expect(checkThreatModel(PATH, bare)).toEqual([
      `${PATH}: no "ASVS level: L1|L2|L3" line (ADR 0207, amendment of 2026-11-26)`,
      `${PATH}: no "Reviewed: YYYY-MM-DD" line (constitution SEC10)`,
    ]);
    expect(checkThreatModel(PATH, MODEL.replace("ASVS level: L2", "ASVS level: L4"))).toHaveLength(
      1,
    );
  });

  it("reports a missing section and sections out of order", () => {
    expect(checkThreatModel(PATH, MODEL.replace("## Trust boundaries", "## Boundaries"))).toEqual([
      `${PATH}: no "## Trust boundaries" section (constitution SEC10)`,
    ]);
    const swapped = MODEL.replace("## Assets", "## Tmp")
      .replace("## Threats and controls", "## Assets")
      .replace("## Tmp", "## Threats and controls");
    expect(checkThreatModel(PATH, swapped).some((f) => f.includes("out of order"))).toBe(true);
  });

  it("refuses a wrong table header and an empty table", () => {
    expect(
      checkThreatModel(
        PATH,
        MODEL.replace("| Asset | Where it lives | Class |", "| Asset | Class |"),
      ),
    ).toEqual([`${PATH}:6: "## Assets" table header must be | Asset | Where it lives | Class |`]);
    const empty = MODEL.replace(
      "| A forged cookie | AES-GCM sealed under `cookieKey` | — |\n",
      "",
    ).replace("| A replayed request | None | STA-2803 |\n", "");
    expect(checkThreatModel(PATH, empty)).toEqual([
      `${PATH}:18: "## Threats and controls" has no row`,
    ]);
  });

  it("refuses an unknown class, an empty cell and a boundary section with no numbered item", () => {
    expect(checkThreatModel(PATH, MODEL.replace("| confidential |", "| restricted |"))).toEqual([
      `${PATH}:11: class "restricted" is not one of internal, confidential, pii, secret (constitution SEC4)`,
    ]);
    expect(checkThreatModel(PATH, MODEL.replace("| the browser |", "|  |"))).toEqual([
      `${PATH}:10: an empty cell; write "—" where there is nothing`,
    ]);
    expect(
      checkThreatModel(
        PATH,
        MODEL.replace("1. Client to API", "Client to API").replace("2. API", "API"),
      ),
    ).toEqual([`${PATH}:13: "## Trust boundaries" has no numbered boundary`]);
  });

  it("asks a threat with no control today to name the issue that tracks it", () => {
    expect(checkThreatModel(PATH, MODEL.replace("| None | STA-2803 |", "| None | — |"))).toEqual([
      `${PATH}:23: a threat with no control today names the issue that tracks it in "Open work" (constitution SEC10)`,
    ]);
    expect(
      checkThreatModel(PATH, MODEL.replace("| None | STA-2803 |", "| None yet | later |")),
    ).toHaveLength(1);
  });
});

describe("checkThreatModelIndex", () => {
  const page = "apps/docs/src/docs/customers/threat-model.mdx";

  it("passes when the page links every member's model", () => {
    const text = "[iam](https://example.test/packages/security/iam/docs/threat-model.md)";
    expect(checkThreatModelIndex(page, text, ["packages/security/iam"])).toEqual([]);
  });

  it("reports a missing page and each member it does not link", () => {
    expect(checkThreatModelIndex(page, undefined, [])).toHaveLength(1);
    expect(checkThreatModelIndex(page, "nothing", ["packages/security/iam"])).toEqual([
      `${page}: does not link packages/security/iam/docs/threat-model.md (constitution SEC10)`,
    ]);
  });
});

describe("needsThreatModel", () => {
  it("covers every member of the security folder and the listed members, nothing else", () => {
    expect(needsThreatModel("packages/security/iam")).toBe(true);
    expect(needsThreatModel("packages/security/a-new-one")).toBe(true);
    for (const dir of THREAT_MODEL.members) expect(needsThreatModel(dir)).toBe(true);
    expect(needsThreatModel("packages/foundation/i18n")).toBe(false);
    expect(needsThreatModel("packages/runtime/application")).toBe(false);
  });
});
