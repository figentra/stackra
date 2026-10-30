/**
 * Stackra file contract:
 * Purpose: `DEMO_PHOTOS`, the pictures the native Gallery, Lightbox, Carousel and ImageCropper demos show: tiny
 *          two-colour PNGs as data URLs (React Native's Image draws no SVG), each with the shape its masonry tile keeps.
 * Boundary: data only; each picture's alt text is a key in `assets/lang/<locale>/demo_free.json`.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); STA-1371 (wave C).
 */

/** The pictures: id, the shape a masonry keeps, and the image. */
export const DEMO_PHOTOS = Object.freeze([
  {
    id: "dunes",
    width: 1200,
    height: 800,
    src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAICAIAAABChommAAAAN0lEQVR42mP4dqiKIGL4sL2QIGJ4uTqDIGJ4vCCeIGK4MzWUIGK41uVDEDGcr3MmiBhOFlsRRABa66+B/ayoEQAAAABJRU5ErkJggg==",
  },
  {
    id: "harbour",
    width: 800,
    height: 1100,
    src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAALCAIAAADN+VtyAAAASElEQVR42mOo334TK2IoXXMeK2LIWXQMK2JImrEHK2KI7N2MFTH4N63EihhcK+ZjRQw2edOwIgaj5B6siEEzohkrYpD3q8SKALvgghm9vtUUAAAAAElFTkSuQmCC",
  },
  {
    id: "palms",
    width: 1000,
    height: 1000,
    src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAIAAAACUFjqAAAAQ0lEQVR42mP4f2MFHsTw4swcPIjh4oEJeBDDri3NeBDD4hXleBBD9+xsPIihpD8eD2KIbQ7Cgxjcyt3wIAb9bCs8CABI1qY39K/IYwAAAABJRU5ErkJggg==",
  },
  {
    id: "souk",
    width: 900,
    height: 1200,
    src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAMCAIAAAA/PgD0AAAATklEQVR42mN4ubAKF2K4N70IF2K41JOJCzEcb0rEhRh2l0fiQgwbcgNxIYYlSR64EMPMCAdciKHX1wIXYmhyNsCFGMos1HEhhmw9eVwIALcNk6nnDcBzAAAAAElFTkSuQmCC",
  },
  {
    id: "oasis",
    width: 1200,
    height: 700,
    src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAHCAIAAACz0DtzAAAAMUlEQVR42mNY8eAiQcQw+cJBgoih7sAGgoghc8MCgoghZP4EgojBvr+eIGLQqs8niAA+PJCRnwVyCAAAAABJRU5ErkJggg==",
  },
  {
    id: "skyline",
    width: 800,
    height: 1000,
    src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAKCAIAAAAGpYjXAAAAQ0lEQVR42mM4uf0DVsSwc8VDrIhh5cxLWBHDrK4jWBFDV/VWrIihKnsZVsSQFTMdK2KI9u3Eihi87aqwIgZr/WysCABRO4LJT48kjQAAAABJRU5ErkJggg==",
  },
] as const);
