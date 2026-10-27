/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./node` entry: it exports the S3 disk (a candidate of the template's
 *          `media.MediaDisk` driver choice), the scanners, the `sharp` image transformer, the `document` and
 *          `paddle_ocr` text extractors, the `c2pa` content credentials and the `upload.create` action with its input and output, nothing else.
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
      "CreateUploadAction",
      "CreateUploadInput",
      "CreateUploadOutput",
      "DocumentTextExtractorDriver",
      "GuardDutyFileScannerDriver",
      "PaddleOcrTextExtractorDriver",
      "S3MediaDiskDriver",
      "SharpImageTransformerDriver",
      "UploadPermissions",
    ]);
  });
});
