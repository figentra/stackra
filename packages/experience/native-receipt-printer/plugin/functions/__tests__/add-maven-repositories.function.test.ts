/**
 * Stackra file contract:
 * Purpose: unit tests of `addMavenRepositories`: it lists a vendor repository in `allprojects`, once, leaves a file
 *          without that block unchanged, and refuses a URL that is not https.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0478 (decision 4); ADR 0022 (test placement).
 */
import { describe, expect, it } from "@stackra/testing";

import { addMavenRepositories } from "#plugin/functions/add-maven-repositories.function";

const GRADLE = "allprojects {\n  repositories {\n    google()\n    mavenCentral()\n  }\n}\n";
const VENDOR = "https://maven.vendor.example/releases";

describe("addMavenRepositories", () => {
  it("lists the repository in allprojects once", () => {
    const once = addMavenRepositories(GRADLE, [VENDOR]);
    expect(once).toContain(`repositories {\n    maven { url "${VENDOR}" }`);
    expect(addMavenRepositories(once, [VENDOR])).toBe(once);
  });

  it("leaves a file without the block unchanged", () => {
    expect(addMavenRepositories("buildscript {}\n", [VENDOR])).toBe("buildscript {}\n");
  });

  it("refuses a repository that is not https", () => {
    expect(() => addMavenRepositories(GRADLE, ["http://maven.vendor.example"])).toThrow(
      /not https/,
    );
  });
});
