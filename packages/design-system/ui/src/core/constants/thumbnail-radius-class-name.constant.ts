/**
 * Stackra file contract:
 * Purpose: `THUMBNAIL_RADIUS_CLASS_NAME`, the corner class of a Thumbnail: the theme's large radius token, the same
 *          as a square Avatar, so a product image and an organisation's avatar line up.
 * Boundary: data only; the radius itself is `--radius-lg` in `@stackra/tokens`.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0304; design-system gap inventory row 12.
 */
import { AVATAR_SQUARE_CLASS_NAME } from "#core/constants/avatar-square-class-name.constant";

/** The class that rounds a Thumbnail's corners. */
export const THUMBNAIL_RADIUS_CLASS_NAME = AVATAR_SQUARE_CLASS_NAME;
