/**
 * Stackra file contract:
 * Purpose: `useUpload(options)`, the hook a component uploads a file with: it returns a function that turns a file into
 *          the `Upload` token an action takes, through the `Uploader` of the nearest container.
 * Boundary: resolves the `Uploader` port (`useContainer` throws outside a `ContainerProvider`; an unbound port throws
 *           `UnresolvedPortError`), so a missing driver is a boot or test failure. The returned function is stable
 *           while the uploader and the bucket stay the same. It holds no upload state; the caller tracks pending work.
 * Runtime: isomorphic
 * Governing contract: ADR 0222 (decision 2); ADR 0294 (decision 17); ADR 0295 (decision 10).
 */
import { useContainer } from "@stackra/container/react";
import { useCallback } from "react";

import { Uploader } from "#core/index";
import type { Upload } from "#core/index";

/**
 * An upload function for `options.bucket`, or for the member's only bucket when none is named.
 *
 * @throws Error outside a `ContainerProvider`, or when the container binds no `Uploader`.
 * @example
 * upload = useUpload();
 * const image = await this.upload(file);
 * await this.attachImage.run({ productId, image, alt: null });
 */
export function useUpload(
  options: { readonly bucket?: string } = {},
): (file: Blob) => Promise<Upload> {
  const uploader = useContainer().get(Uploader);
  const bucket = options.bucket ?? null;
  return useCallback((file: Blob) => uploader.upload(file, bucket), [uploader, bucket]);
}
