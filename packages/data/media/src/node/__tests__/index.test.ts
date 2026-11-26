/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./node` entry: it exports the scanners (no S3 disk: media stores through
 *          `FileSystem`, ADR 0465), the `sharp` image transformer, the `document` and
 *          `paddle_ocr` text extractors, the `c2pa` content credentials, the `upload.create` and
 *          `upload.create_resumable` actions with their input and outputs and the tus hook controller, nothing else.
 * Boundary: test only; imports the stand-in barrel through its `#node` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";

import * as node from "#node/index";

describe("@stackra/media/node", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(node).sort()).toEqual([
      "C2paContentCredentialsDriver",
      "ClamavFileScannerDriver",
      "CreateResumableUploadAction",
      "CreateResumableUploadOutput",
      "CreateUploadAction",
      "CreateUploadInput",
      "CreateUploadOutput",
      "DocumentTextExtractorDriver",
      "GuardDutyFileScannerDriver",
      "PaddleOcrTextExtractorDriver",
      "SharpImageTransformerDriver",
      "TusHookController",
      "UploadPermissions",
    ]);
  });
});
