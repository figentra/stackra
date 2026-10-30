/**
 * Stackra file contract:
 * Purpose: proves `svgPngOf`: an unmeasured SVG gives no PNG; a measured one is copied with its computed paint inlined,
 *          drawn at twice its size over the given background, and encoded as a PNG; a failed decode or a missing 2D
 *          context gives none; and the object URL is always revoked.
 * Boundary: jsdom; image decoding, the canvas context and its encoder are stand-ins, since jsdom draws nothing.
 * Runtime: browser
 * Governing contract: ADR 0307; ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { svgPngOf } from "#react/widget-frame/svg-png-of.function";

const sized = (width: number, height: number) => {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.append(document.createElementNS("http://www.w3.org/2000/svg", "rect"));
  svg.getBoundingClientRect = () => ({ width, height }) as DOMRect;
  return svg;
};

let decode: ReturnType<typeof vi.fn>;
let context: {
  fillStyle: string;
  fillRect: ReturnType<typeof vi.fn>;
  drawImage: ReturnType<typeof vi.fn>;
} | null;
let sources: Blob[];

beforeEach(() => {
  sources = [];
  URL.createObjectURL = vi.fn((blob: Blob) => {
    sources.push(blob);
    return "blob:svg";
  });
  URL.revokeObjectURL = vi.fn();
  decode = vi.fn(async () => undefined);
  // jsdom has no image decoding.
  HTMLImageElement.prototype.decode = decode as unknown as HTMLImageElement["decode"];
  // jsdom resolves no SVG paint, so the computed fill is given.
  vi.spyOn(window, "getComputedStyle").mockReturnValue({
    getPropertyValue: (name: string) => (name === "fill" ? "red" : ""),
  } as CSSStyleDeclaration);
  context = { fillStyle: "", fillRect: vi.fn(), drawImage: vi.fn() };
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
    (() => context) as unknown as HTMLCanvasElement["getContext"],
  );
  vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(function (callback) {
    callback(new Blob(["png"], { type: "image/png" }));
  });
});

afterEach(() => vi.restoreAllMocks());

describe("svgPngOf", () => {
  it("gives nothing for an SVG with no size", async () => {
    expect(await svgPngOf(sized(0, 10), "white")).toBeNull();
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it("inlines the paint, draws at twice the size over the background, and encodes a PNG", async () => {
    const png = await svgPngOf(sized(100, 50), "rgb(1, 2, 3)");
    expect(png?.type).toBe("image/png");
    const source = await sources[0]?.text();
    expect(source).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(source).toContain('width="100"');
    expect(source).toContain('fill="red"');
    expect(context?.fillStyle).toBe("rgb(1, 2, 3)");
    expect(context?.fillRect).toHaveBeenCalledWith(0, 0, 200, 100);
    expect(context?.drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 200, 100);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:svg");
  });

  it("gives nothing when the image cannot be decoded or the canvas has no 2D context", async () => {
    decode.mockRejectedValueOnce(new Error("bad svg"));
    expect(await svgPngOf(sized(10, 10), "white")).toBeNull();
    context = null;
    expect(await svgPngOf(sized(10, 10), "white")).toBeNull();
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2);
  });
});
