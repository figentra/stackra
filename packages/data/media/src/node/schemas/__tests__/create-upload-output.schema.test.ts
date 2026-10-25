/**
 * Stackra file contract:
 * Purpose: unit tests of `CreateUploadOutput`: its shipped schema is registered, builds from code-form values with a
 *          `Date`, encodes the expiry as ISO 8601 on the wire, and refuses a method other than `PUT`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 26).
 */
import { schemaOf } from "@stackra/validation";
import { describe, expect, it } from "@stackra/testing";
import { z } from "zod";

import { CREATE_UPLOAD_OUTPUT_SCHEMA } from "#node/constants/create-upload-output-schema.constant";
import { CreateUploadOutput } from "#node/schemas/create-upload-output.schema";

const VALUES = {
  upload: { id: "upl_01jb3m0000000000000000000a" as const },
  url: "https://store.test/uploads/upl_01jb3m0000000000000000000a?X-Amz-Signature=abc",
  method: "PUT" as const,
  headers: { "content-type": "image/png" },
  expiresAt: new Date("2026-10-24T10:00:00.000Z"),
};

describe("CreateUploadOutput", () => {
  it("registers its shipped schema", () => {
    expect(schemaOf(CreateUploadOutput)).toBe(CREATE_UPLOAD_OUTPUT_SCHEMA);
  });

  it("builds from code-form values", () => {
    const output = CreateUploadOutput.create(VALUES);
    expect(output).toBeInstanceOf(CreateUploadOutput);
    expect(output.expiresAt).toEqual(VALUES.expiresAt);
  });

  it("puts the expiry on the wire as ISO 8601", () => {
    expect(z.encode(CREATE_UPLOAD_OUTPUT_SCHEMA, VALUES).expiresAt).toBe(
      "2026-10-24T10:00:00.000Z",
    );
  });

  it("refuses another method", () => {
    expect(CREATE_UPLOAD_OUTPUT_SCHEMA.safeParse({ ...VALUES, method: "POST" }).success).toBe(
      false,
    );
  });
});
