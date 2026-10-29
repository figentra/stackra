/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryIncomingShareDriver` and the checks of `IncomingShareDriver`: accepted kinds and
 *          file types, the item limit, the text length, http links only, a file's size limit, `receive` notifying
 *          subscribers and `clear` forgetting everything.
 * Boundary: test only; in memory, no device.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0478 (decision 5).
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { NativeShareConfig } from "#config/native-share.config";
import { IncomingShare } from "#contracts/ports/incoming-share.port";
import type { SharedItem } from "#contracts/types/shared-item.type";
import { MemoryIncomingShareDriver } from "#core/drivers/memory-incoming-share.driver";

const PHOTO: SharedItem = {
  kind: "file",
  value: "file:///p.jpg",
  mimeType: "image/jpeg",
  name: "p.jpg",
};
const PDF: SharedItem = {
  kind: "file",
  value: "file:///a.pdf",
  mimeType: "application/pdf",
  name: "a.pdf",
};
const ZIP: SharedItem = {
  kind: "file",
  value: "file:///z.zip",
  mimeType: "application/zip",
  name: "z.zip",
};
const LINK: SharedItem = {
  kind: "url",
  value: "https://example.com",
  mimeType: "text/plain",
  name: null,
};
const SCRIPT: SharedItem = {
  kind: "url",
  value: "javascript:alert(1)",
  mimeType: "text/plain",
  name: null,
};
const TEXT: SharedItem = { kind: "text", value: "hello", mimeType: "text/plain", name: null };

describe("MemoryIncomingShareDriver", () => {
  it("is an IncomingShare driver", () => {
    expect(new MemoryIncomingShareDriver()).toBeInstanceOf(IncomingShare);
  });

  it("keeps photos, PDFs, http links and text, and drops other files and links", async () => {
    const share = new MemoryIncomingShareDriver();
    for (const item of [PHOTO, PDF, ZIP, LINK, SCRIPT, TEXT]) share.receive(item);
    expect(await share.pending()).toEqual([PHOTO, PDF, LINK, TEXT]);
  });

  it("applies the configured limits", async () => {
    /** A host that takes one item and three characters of text. */
    class TightConfig extends NativeShareConfig {
      override maxItems = 1;

      override maxTextLength = 3;
    }
    const share = new MemoryIncomingShareDriver(new TightConfig());
    share.receive(TEXT);
    share.receive(PHOTO);
    share.receive(PDF);
    expect(await share.pending()).toEqual([PHOTO]);
  });

  it("reads a file within maxBytes and refuses a larger one, a text and a refused type", async () => {
    /** A host that reads files of four bytes at most. */
    class SmallFilesConfig extends NativeShareConfig {
      override maxBytes = 4;
    }
    const share = new MemoryIncomingShareDriver(new SmallFilesConfig());
    share.receive(PHOTO, new Blob(["jpg"]));
    share.receive(PDF, new Blob(["too large"]));
    share.receive(ZIP, new Blob(["z"]));
    expect(await (await share.read(PHOTO))?.text()).toBe("jpg");
    expect(await share.read(PDF)).toBeNull();
    expect(await share.read(ZIP)).toBeNull();
    expect(await share.read(TEXT)).toBeNull();
  });

  it("notifies subscribers on receive until they unsubscribe", () => {
    const share = new MemoryIncomingShareDriver();
    const listener = vi.fn();
    const unsubscribe = share.subscribe(listener);
    share.receive(TEXT);
    unsubscribe();
    share.receive(LINK);
    expect(listener).toHaveBeenCalledOnce();
  });

  it("forgets every item and file on clear", async () => {
    const share = new MemoryIncomingShareDriver();
    share.receive(PHOTO, new Blob(["jpg"]));
    await share.clear();
    expect(await share.pending()).toEqual([]);
    expect(await share.read(PHOTO)).toBeNull();
  });
});
