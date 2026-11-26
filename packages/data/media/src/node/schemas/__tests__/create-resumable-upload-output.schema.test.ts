/**
 * Stackra file contract:
 * Purpose: unit tests of `CreateResumableUploadOutput`: its shipped schema is registered, builds from code-form values
 *          with a `Date`, encodes the expiry as ISO 8601 on the wire, and refuses a malformed token or an empty URL.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 26).
 */
import { schemaOf } from "@stackra/validation";
import { describe, expect, it } from "@stackra/testing";
import { z } from "zod";

import { CREATE_RESUMABLE_UPLOAD_OUTPUT_SCHEMA } from "#node/constants/create-resumable-upload-output-schema.constant";
import { CreateResumableUploadOutput } from "#node/schemas/create-resumable-upload-output.schema";

const VALUES = {
  upload: { id: "upl_01jb3m0000000000000000000a" as const },
  url: "https://uploads.test/files/",
  headers: { "tus-resumable": "1.0.0", "upload-metadata": "upload dXBs" },
  expiresAt: new Date("2026-10-24T10:00:00.000Z"),
};

describe("CreateResumableUploadOutput", () => {
  it("registers its shipped schema", () => {
    expect(schemaOf(CreateResumableUploadOutput)).toBe(CREATE_RESUMABLE_UPLOAD_OUTPUT_SCHEMA);
  });

  it("builds from code-form values", () => {
    const output = CreateResumableUploadOutput.create(VALUES);
    expect(output).toBeInstanceOf(CreateResumableUploadOutput);
    expect(output.headers).toEqual(VALUES.headers);
    expect(output.expiresAt).toEqual(VALUES.expiresAt);
  });

  it("puts the expiry on the wire as ISO 8601", () => {
    expect(z.encode(CREATE_RESUMABLE_UPLOAD_OUTPUT_SCHEMA, VALUES).expiresAt).toBe(
      "2026-10-24T10:00:00.000Z",
    );
  });

  it("refuses a malformed token and an empty URL", () => {
    const schema = CREATE_RESUMABLE_UPLOAD_OUTPUT_SCHEMA;
    expect(schema.safeParse({ ...VALUES, upload: { id: "../x" } }).success).toBe(false);
    expect(schema.safeParse({ ...VALUES, url: "" }).success).toBe(false);
  });
});
