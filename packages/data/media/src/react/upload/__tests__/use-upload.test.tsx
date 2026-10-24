/**
 * Stackra file contract:
 * Purpose: unit tests of `useUpload(options)`: the returned function uploads through the `Uploader` the nearest
 *          container binds, into the named bucket or the member's only one, and the hook throws outside a provider and
 *          when nothing binds the port.
 * Boundary: test only; renders with react-dom/server (no DOM needed); the memory uploader stands in for the HTTP one.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0222 (decision 2); ADR 0295 (decision 10).
 */
import assert from "node:assert/strict";

import { Container } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { describe, expect, it } from "@stackra/testing";
import { renderToString } from "react-dom/server";

import { MemoryUploaderDriver, Uploader } from "#core/index";
import type { Upload } from "#core/index";
import { useUpload } from "#react/upload/use-upload";

type UploadFunction = (file: Blob) => Promise<Upload>;

/** Hands the hook's upload function to the test. */
function Probe({
  bucket,
  onUpload,
}: {
  readonly bucket?: string;
  readonly onUpload: (upload: UploadFunction) => void;
}) {
  onUpload(useUpload(bucket === undefined ? {} : { bucket }));
  return null;
}

/** Renders the probe in a container that binds `uploader`, and returns the hook's function. */
async function renderWith(uploader: Uploader | null, bucket?: string): Promise<UploadFunction> {
  const container = await Container.create(
    [],
    uploader === null ? {} : { overrides: new Map([[Uploader, uploader]]) },
  );
  let upload: UploadFunction | undefined;
  renderToString(
    <ContainerProvider container={container}>
      <Probe
        {...(bucket === undefined ? {} : { bucket })}
        onUpload={(given) => {
          upload = given;
        }}
      />
    </ContainerProvider>,
  );
  assert(upload, "the probe rendered");
  return upload;
}

const FILE = new File(["front"], "front.jpg", { type: "image/jpeg" });

describe("useUpload", () => {
  it("uploads through the container's Uploader into the only bucket", async () => {
    const uploader = new MemoryUploaderDriver();
    const upload = await renderWith(uploader);
    const token = await upload(FILE);
    expect(uploader.uploads).toEqual([{ file: FILE, bucket: null, upload: token }]);
  });

  it("uploads into the named bucket", async () => {
    const uploader = new MemoryUploaderDriver();
    const upload = await renderWith(uploader, "catalogue.product_images");
    await upload(FILE);
    expect(uploader.uploads[0]?.bucket).toBe("catalogue.product_images");
  });

  it("throws outside a ContainerProvider", () => {
    expect(() => renderToString(<Probe onUpload={() => undefined} />)).toThrow(/ContainerProvider/);
  });

  it("throws when the container binds no Uploader", async () => {
    await expect(renderWith(null)).rejects.toThrow(/Uploader/);
  });
});
