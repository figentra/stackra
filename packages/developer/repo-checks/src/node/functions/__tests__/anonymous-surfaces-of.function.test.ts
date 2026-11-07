/**
 * Stackra file contract:
 * Purpose: unit tests of `anonymousSurfacesOf`: a member's own anonymous-callable calls are listed by their locked keys
 *          (from `anonymous: true` or an older manifest's `actors`), a hosted row is left to its owner; and the
 *          committed manifests of this repository list exactly the five in REVIEWED_ANONYMOUS_SURFACES, so a new one
 *          fails here until it is reviewed and recorded, and a removed one leaves no stale record.
 * Boundary: test only; the last case reads the repository's committed `stackra.manifest.json` files.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); STA-2025.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "@stackra/testing";

import { REVIEWED_ANONYMOUS_SURFACES } from "#node/constants/reviewed-anonymous-surfaces.constant";
import { anonymousSurfacesOf } from "#node/functions/anonymous-surfaces-of.function";

/** The repository root. */
const ROOT = fileURLToPath(new URL("../../../../../../../", import.meta.url));

describe("anonymousSurfacesOf", () => {
  it("lists a member's own anonymous-callable calls, sorted, and leaves hosted rows to their owner", () => {
    expect(
      anonymousSurfacesOf({
        actions: [
          { key: "identity.passkey.verify@1", anonymous: true },
          { key: "identity.passkey.challenge@1", actors: ["anonymous", "user"] },
          { key: "identity.session.end@1", actors: ["user"] },
          { key: "consent.consent_snapshot.issue@1", anonymous: true, from: "@stackra/consent" },
        ],
      }),
    ).toEqual(["identity.passkey.challenge@1", "identity.passkey.verify@1"]);
    expect(anonymousSurfacesOf({})).toEqual([]);
  });

  it("finds exactly the five reviewed anonymous-callable calls in this repository", () => {
    const manifests = ["packages", "services", "apps"].flatMap((top) =>
      (top === "packages"
        ? readdirSync(join(ROOT, top), { withFileTypes: true })
            .filter((category) => category.isDirectory())
            .flatMap((category) =>
              readdirSync(join(ROOT, top, category.name)).map((name) =>
                join(ROOT, top, category.name, name),
              ),
            )
        : readdirSync(join(ROOT, top)).map((name) => join(ROOT, top, name))
      )
        .map((dir) => join(dir, "stackra.manifest.json"))
        .filter((file) => existsSync(file)),
    );
    const keys = manifests
      .flatMap((file) => anonymousSurfacesOf(JSON.parse(readFileSync(file, "utf8"))))
      // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds
      .sort();
    // oxlint-disable-next-line unicorn/no-array-sort -- sorts a copy of the keys, built here
    expect(keys).toEqual(Object.keys(REVIEWED_ANONYMOUS_SURFACES).sort());
    expect(keys).toHaveLength(5);
  });
});
