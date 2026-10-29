/**
 * Stackra file contract:
 * Purpose: unit tests of `keepSharedItem` and `uploadSharedItem`: an accepted file reaches the FileSystem disk with
 *          its media type and the media Uploader; a text or a refused file stores and uploads nothing.
 * Boundary: test only; the memory share, the memory disk and a fake uploader.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0465; ADR 0222.
 */
import { buildConfig } from "@stackra/config";
import { Clock } from "@stackra/contracts";
import { FilesystemConfig, MemoryFileSystemDriver } from "@stackra/filesystem";
import type { Upload, Uploader } from "@stackra/media";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import type { SharedItem } from "#contracts/types/shared-item.type";
import { MemoryIncomingShareDriver } from "#core/drivers/memory-incoming-share.driver";
import { keepSharedItem } from "#core/functions/keep-shared-item.function";
import { uploadSharedItem } from "#core/functions/upload-shared-item.function";

const PDF: SharedItem = {
  kind: "file",
  value: "file:///a.pdf",
  mimeType: "application/pdf",
  name: "a.pdf",
};
const TEXT: SharedItem = { kind: "text", value: "hello", mimeType: "text/plain", name: null };

/** Always 2026-10-29T09:00Z. */
class FixedClock extends Clock {
  now(): Date {
    return new Date("2026-10-29T09:00:00.000Z");
  }
}

/** A memory disk. */
function disk(): MemoryFileSystemDriver {
  return new MemoryFileSystemDriver(buildConfig(FilesystemConfig), new FixedClock());
}

describe("keepSharedItem", () => {
  it("writes an accepted file to the disk with its media type", async () => {
    const share = new MemoryIncomingShareDriver();
    share.receive(PDF, new Blob(["%PDF"]));
    const files = disk();
    expect(await keepSharedItem(share, PDF, files, "inbox/a.pdf")).toBe(true);
    expect(new TextDecoder().decode(await files.read("inbox/a.pdf"))).toBe("%PDF");
    expect((await files.stat("inbox/a.pdf")).contentType).toBe("application/pdf");
  });

  it("stores nothing for a text", async () => {
    const files = disk();
    expect(await keepSharedItem(new MemoryIncomingShareDriver(), TEXT, files, "inbox/t")).toBe(
      false,
    );
    expect(await files.exists("inbox/t")).toBe(false);
  });
});

describe("uploadSharedItem", () => {
  it("uploads an accepted file and skips a text", async () => {
    const share = new MemoryIncomingShareDriver();
    share.receive(PDF, new Blob(["%PDF"]));
    const token = { id: "upl_1" } as unknown as Upload;
    const upload = vi.fn(async () => token);
    const uploader = { upload } as unknown as Uploader;
    expect(await uploadSharedItem(share, PDF, uploader, "documents.receipts")).toBe(token);
    expect(await uploadSharedItem(share, TEXT, uploader, null)).toBeNull();
    expect(upload).toHaveBeenCalledOnce();
  });
});
