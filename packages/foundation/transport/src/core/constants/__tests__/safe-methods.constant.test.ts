/**
 * Stackra file contract:
 * Purpose: unit tests of `SAFE_METHODS` and `IDEMPOTENT_METHODS`: reads are safe; `PUT` and `DELETE` are idempotent
 *          too; `POST` and `PATCH` are neither.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269; ADR 0138.
 */
import { describe, expect, it } from "@stackra/testing";

import { IDEMPOTENT_METHODS } from "#core/constants/idempotent-methods.constant";
import { SAFE_METHODS } from "#core/constants/safe-methods.constant";

describe("SAFE_METHODS and IDEMPOTENT_METHODS", () => {
  it("lists the read methods as safe", () => {
    expect([...SAFE_METHODS].sort()).toEqual(["GET", "HEAD", "OPTIONS"]);
  });

  it("adds PUT and DELETE as idempotent, never POST or PATCH", () => {
    expect([...IDEMPOTENT_METHODS].sort()).toEqual(["DELETE", "GET", "HEAD", "OPTIONS", "PUT"]);
  });
});
