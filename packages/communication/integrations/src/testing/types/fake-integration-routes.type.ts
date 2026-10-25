/**
 * Stackra file contract:
 * Purpose: `FakeIntegrationRoutes`, the builder `fakeIntegrationApi` hands its callback: one route per method and path,
 *          each with its answer (`fake.get("/domains").returns(() => ({ data: [] }))`).
 * Boundary: a type only. A path may name `:parameters`; a later route for the same method and path wins.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3).
 */
import type { FakeAnswer } from "#testing/types/fake-answer.type";

/** One route waiting for its answer. */
interface PendingRoute<P extends string> {
  /** Sets the route's answer and returns the builder for the next route. */
  returns(answer: FakeAnswer<P>): FakeIntegrationRoutes;
}

/**
 * The routes of a fake managed client.
 *
 * @example
 * fakeIntegrationApi(ResendIntegration, (fake) => fake.get("/domains").returns(() => ({ data: [] })));
 */
export interface FakeIntegrationRoutes {
  /** A `GET` route. */
  get<P extends string>(path: P): PendingRoute<P>;

  /** A `DELETE` route. */
  delete<P extends string>(path: P): PendingRoute<P>;

  /** A `POST` route. */
  post<P extends string>(path: P): PendingRoute<P>;

  /** A `PUT` route. */
  put<P extends string>(path: P): PendingRoute<P>;

  /** A `PATCH` route. */
  patch<P extends string>(path: P): PendingRoute<P>;
}
