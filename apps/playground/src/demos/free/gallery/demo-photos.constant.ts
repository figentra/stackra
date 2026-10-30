/**
 * Stackra file contract:
 * Purpose: `DEMO_PHOTOS`, the pictures the Gallery, Lightbox, Carousel and ImageCropper demos show: drawn landscapes
 *          as SVG data URLs, each with its own shape and colours, so the demos never touch the network.
 * Boundary: data only; each picture's words (alt and caption) are keys in `assets/lang/<locale>/gallery.json`.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); STA-1371 (wave C).
 */

/** The pictures: id, width, height, sky and ground colours. */
export const DEMO_PHOTOS = Object.freeze(
  (
    [
      ["dunes", 1200, 800, "#f6c27a", "#c9733a"],
      ["harbour", 800, 1100, "#7fb7d9", "#1f4e79"],
      ["palms", 1000, 1000, "#ffd8a8", "#2f6b3a"],
      ["souk", 900, 1200, "#e9a17a", "#6b2e1f"],
      ["oasis", 1200, 700, "#a8e0d1", "#2a7f6f"],
      ["skyline", 800, 1000, "#c9b7f0", "#3b2f6b"],
      ["lanterns", 1100, 800, "#2b2141", "#d98e2b"],
      ["coast", 1000, 1300, "#bfe3f5", "#d9b98c"],
    ] as const
  ).map(([id, width, height, sky, ground]) => ({
    id,
    width,
    height,
    src: `data:image/svg+xml,${encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'><defs><linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='${sky}'/><stop offset='1' stop-color='${ground}'/></linearGradient></defs><rect width='100%' height='100%' fill='url(#g)'/><circle cx='${width * 0.7}' cy='${height * 0.3}' r='${Math.min(width, height) * 0.1}' fill='#fff' fill-opacity='.75'/><path d='M0 ${height * 0.72} Q ${width * 0.3} ${height * 0.55} ${width * 0.55} ${height * 0.7} T ${width} ${height * 0.66} V ${height} H 0 Z' fill='#000' fill-opacity='.2'/><path d='M0 ${height * 0.85} Q ${width * 0.45} ${height * 0.72} ${width} ${height * 0.86} V ${height} H 0 Z' fill='#000' fill-opacity='.25'/></svg>`,
    )}`,
  })),
);
