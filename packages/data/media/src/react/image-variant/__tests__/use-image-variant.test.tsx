/**
 * Stackra file contract:
 * Purpose: unit tests of `useImageVariant(image, options)`: the template card's 480px WebP `src`, a URL string, the box
 *          it returns, `undefined` for an absent image, and a refused box.
 * Boundary: test only; renders with react-dom/server (no DOM needed) and needs no container.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0222 (decision 4); ADR 0183.
 */
import { describe, expect, it } from "@stackra/testing";
import { renderToString } from "react-dom/server";

import { ImageFormat } from "#core/index";
import type { ImageVariant, ImageVariantOptions } from "#core/index";
import { useImageVariant } from "#react/image-variant/use-image-variant";

type Image = Parameters<typeof useImageVariant>[0];

/** The template's card image. */
function Card({ image }: { readonly image: { url: string; alt: string | null } | null }) {
  const variant = useImageVariant(image, { width: 480, format: ImageFormat.Webp });
  return <img src={variant?.url} alt="" width={480} height={480} />;
}

/** Hands what the hook gave to the test. */
function Probe({
  image,
  options,
  onVariant,
}: {
  readonly image: Image;
  readonly options: ImageVariantOptions;
  readonly onVariant: (variant: ImageVariant | undefined) => void;
}) {
  onVariant(useImageVariant(image, options));
  return null;
}

/** Renders the probe once and returns what the hook gave. */
function probe(image: Image, options: ImageVariantOptions): ImageVariant | undefined {
  const seen: (ImageVariant | undefined)[] = [];
  renderToString(
    <Probe image={image} options={options} onVariant={(variant) => seen.push(variant)} />,
  );
  return seen[0];
}

describe("useImageVariant", () => {
  it("renders the template card's 480px WebP variant", () => {
    expect(renderToString(<Card image={{ url: "https://cdn.test/tee.jpg", alt: "" }} />)).toBe(
      '<img src="https://cdn.test/tee.jpg?w=480&amp;format=webp" alt="" width="480" height="480"/>',
    );
  });

  it("returns the URL and the box asked for, from an object or a string", () => {
    expect(probe({ url: "https://cdn.test/tee.jpg" }, { width: 960, height: 640 })).toEqual({
      url: "https://cdn.test/tee.jpg?w=960&h=640",
      width: 960,
      height: 640,
    });
    expect(probe("https://cdn.test/tee.jpg", { width: 96 })).toEqual({
      url: "https://cdn.test/tee.jpg?w=96",
      width: 96,
    });
  });

  it("gives undefined for an absent image", () => {
    expect(probe(null, { width: 96 })).toBeUndefined();
    expect(probe(undefined, { width: 96 })).toBeUndefined();
    expect(renderToString(<Card image={null} />)).toBe('<img alt="" width="480" height="480"/>');
  });

  it("refuses a box that is not whole pixels", () => {
    expect(() => probe("https://cdn.test/tee.jpg", { width: 0 })).toThrow(RangeError);
  });
});
