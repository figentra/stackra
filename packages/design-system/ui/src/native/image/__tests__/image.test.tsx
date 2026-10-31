/**
 * Stackra file contract:
 * Purpose: proves the native Image hands the Thumbnail the full width and its ratio, writes the caption, and that a
 *          zoomable one is a button that opens the Lightbox.
 * Boundary: react-native is the DOM stand-in of `#testing/fakes/native-dom`; Thumbnail, Lightbox and Text are stand-ins.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";

import { Image } from "#native/image/image";

const seen = vi.hoisted(() => ({
  thumbnails: [] as Record<string, unknown>[],
  lightboxes: [] as Record<string, unknown>[],
}));

vi.mock("react-native", async () => (await import("#testing/fakes/native-dom")).nativeDom);
vi.mock("#native/text/text", async () => (await import("#testing/fakes/text-dom")).textDom);
vi.mock("#native/thumbnail/thumbnail", () => ({
  Thumbnail: (props: Record<string, unknown>) => {
    seen.thumbnails.push(props);
    return null;
  },
}));
vi.mock("#native/lightbox/lightbox", () => ({
  Lightbox: (props: Record<string, unknown>) => {
    seen.lightboxes.push(props);
    return null;
  },
}));

describe("Image (native)", () => {
  it("stretches the thumbnail and writes the caption", () => {
    render(<Image src="https://x/souq.jpg" alt="Souq Waqif" caption="Doha" aspectRatio={2} />);
    expect(seen.thumbnails.at(-1)).toMatchObject({
      alt: "Souq Waqif",
      aspectRatio: 2,
      style: { width: "100%" },
    });
    expect(screen.getByText("Doha")).toBeTruthy();
  });

  it("opens the lightbox when zoomable", () => {
    render(<Image src="https://x/souq.jpg" alt="Souq Waqif" isZoomable />);
    fireEvent.click(screen.getByRole("imagebutton", { name: "Open Souq Waqif" }));
    expect(seen.lightboxes.at(-1)).toMatchObject({ isOpen: true, label: "Souq Waqif" });
  });
});
