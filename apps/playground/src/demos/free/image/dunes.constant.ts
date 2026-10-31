/**
 * Stackra file contract:
 * Purpose: `DUNES`, a flat drawing of desert dunes at dusk and a 4-pixel copy of it, inline, so the
 *          Image demos and their e2e suite never touch the network.
 * Boundary: demo data only; the colours are the picture's own, not interface colours.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); STA-1371.
 */

/** The picture (`src`) and the same picture at 4 pixels (`tiny`), as an image service would send first. */
export const DUNES = {
  src: `data:image/svg+xml,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 90"><rect width="160" height="90" fill="#f3b46b"/><circle cx="118" cy="30" r="12" fill="#fde9c4"/><path d="M0 62 Q40 40 80 60 T160 52 V90 H0z" fill="#d9894a"/><path d="M0 76 Q50 58 100 74 T160 70 V90 H0z" fill="#a85a2e"/></svg>',
  )}`,
  tiny: `data:image/svg+xml,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4 2"><rect width="4" height="2" fill="#f3b46b"/><rect y="1" width="4" height="1" fill="#c07040"/></svg>',
  )}`,
} as const;
