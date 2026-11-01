/**
 * Stackra file contract:
 * Purpose: `BINARY_RE`, the template files the scaffold copies byte for byte: images, fonts and documents hold no
 *          tokens and a text round trip corrupts them.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0126 (member shapes and scaffold templates); ADR 0294; ADR 0453 (decision 11).
 */

/** File names copied without token replacement. */
export const BINARY_RE = /\.(png|jpe?g|gif|webp|avif|ico|woff2?|ttf|otf|pdf)$/i;
