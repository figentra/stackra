/**
 * Stackra file contract:
 * Purpose: `svgSourceOf`, a chart's SVG as a standalone SVG document: the theme paints the chart through `var(--…)`
 *          attributes that a file opened on its own cannot resolve, so every element's computed fill, stroke, stop
 *          colour, opacity and font are written onto a copy first. The SVG download and the PNG both start from it.
 * Boundary: browser only; reads computed styles. Text keeps the page's font family, so Arabic is shaped by the viewer.
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

/** The source of a standalone copy of `svg`, painted as on screen and sized as drawn. */
export function svgSourceOf(svg: SVGSVGElement): string {
  const { width, height } = svg.getBoundingClientRect();
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
  return new XMLSerializer().serializeToString(copy);
}
