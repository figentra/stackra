/**
 * Stackra file contract:
 * Purpose: `AppReview`, the review record of one app version in the app market: which listing and version, its state,
 *          who reviewed it and the notes sent back.
 * Boundary: a shape class; registers this package's schema for itself when the module loads. The registry service
 *           stores it and moves it only through `canTransitionReview`.
 * Runtime: isomorphic
 * Governing contract: ADR 0355 (decision 8); ADR 0294 (decisions 22 and 26).
 */
import { registerSchemas, Schema } from "@stackra/validation";

import { APP_REVIEW_SCHEMA } from "#core/constants/app-review-schema.constant";
import type { ReviewState } from "#core/enums/review-state.enum";

/**
 * One app version's review.
 *
 * @example
 * validate(AppReview, { app: "acme.loyalty", version: "1.2.0", state: "submitted" });
 */
export class AppReview extends Schema {
  /** The listing key of the app. */
  app!: string;

  /** The version under review. */
  version!: string;

  /** Where the review stands. */
  state!: ReviewState;

  /** The reviewer's principal id; null before one takes it. */
  reviewer: string | null = null;

  /** The notes sent back to the developer. */
  notes: string | null = null;
}

registerSchemas([[AppReview, APP_REVIEW_SCHEMA]]);
