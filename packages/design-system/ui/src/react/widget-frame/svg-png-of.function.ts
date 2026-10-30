/**
 * Stackra file contract:
 * Purpose: `svgPngOf`, a chart's SVG as a PNG blob at twice its size on the card's own background. The theme paints
 *          the chart through `var(--…)` attributes that an image loaded on its own cannot resolve, so every element's
 *          computed fill, stroke, stop colour, opacity and font are written onto a copy first.
 * Boundary: browser only; reads computed styles, draws on an offscreen canvas. Text keeps the page's font family, so
 *           Arabic is shaped by the browser as on screen.
 * Runtime: browser
 * Governing contract: ADR 0307 (decisions 14 to 18); ADR 0302 (decision 3); STA-1371.
 */

/** The painted properties copied from the live chart onto its copy. */
const PAINTED = [
  "fill",
  "fill-opacity",
  "stroke",
  "stroke-opacity",
  "stroke-width",
  "stroke-dasharray",
  "stop-color",
  "stop-opacity",
  "opacity",
  "font-family",
  "font-size",
  "font-weight",
] as const;

/** The PNG of `svg` on `background`, or null when the browser cannot draw it. */
export async function svgPngOf(svg: SVGSVGElement, background: string): Promise<Blob | null> {
  const { width, height } = svg.getBoundingClientRect();
  if (width === 0 || height === 0) return null;
  const copy = svg.cloneNode(true) as SVGSVGElement;
  const live = [svg, ...svg.querySelectorAll("*")];
  const copied = [copy, ...copy.querySelectorAll("*")];
  live.forEach((element, index) => {
    const target = copied[index];
    if (!target) return;
    const style = getComputedStyle(element);
    for (const name of PAINTED) {
      const value = style.getPropertyValue(name);
      if (value) target.setAttribute(name, value);
    }
  });
  copy.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  copy.setAttribute("width", String(width));
  copy.setAttribute("height", String(height));
  const source = new XMLSerializer().serializeToString(copy);
  const url = URL.createObjectURL(new Blob([source], { type: "image/svg+xml;charset=utf-8" }));
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const scale = 2;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const context = canvas.getContext("2d");
    if (!context) return null;
    context.fillStyle = background;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return await new Promise((resolve) => {
      canvas.toBlob(resolve, "image/png");
    });
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}
