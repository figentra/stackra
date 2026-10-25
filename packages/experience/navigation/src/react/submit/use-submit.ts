/**
 * Stackra file contract:
 * Purpose: `useSubmit<typeof X>()`, a page's handle on its route's `submit`: call it with the form's values to post
 *          them (`<Form form={form} submit={this.submit}>`), read `isPending`, `data` and `fieldErrors` back.
 * Boundary: a React Router fetcher posting JSON to the page's own route, so the URL and the history do not change; the
 *           route's `ctx.formData()` reads the JSON body. A redirect the submit answers is followed by the router.
 * Runtime: browser
 * Governing contract: ADR 0165 (form adapters); ADR 0140 (field errors); ADR 0294 (decision 16).
 */
import type { AnyClass } from "@stackra/container";
import type { FieldErrors } from "@stackra/errors";
import { useFetcher } from "react-router";

import type { Route } from "#core/bases/route.base";
import type { RouteSubmit } from "#react/submit/route-submit.type";

/** The field errors in a submit's answer, or none. */
function fieldErrorsIn(answer: unknown): FieldErrors {
  if (typeof answer !== "object" || answer === null) return {};
  const errors = (answer as { readonly fieldErrors?: unknown }).fieldErrors;
  return typeof errors === "object" && errors !== null ? (errors as FieldErrors) : {};
}

/**
 * The submit handle of route class `R`.
 *
 * @example
 * submit = useSubmit<typeof QuickOrderRoute>();
 * <Button type="submit" isPending={this.submit.isPending}>
 */
export function useSubmit<R extends AnyClass<Route>>(): RouteSubmit<R> {
  const fetcher = useFetcher();
  const post = (values: Readonly<Record<string, unknown>>) =>
    fetcher.submit(values as Parameters<typeof fetcher.submit>[0], {
      method: "post",
      encType: "application/json",
    });
  return Object.assign(post, {
    isPending: fetcher.state !== "idle",
    data: fetcher.data as RouteSubmit<R>["data"],
    fieldErrors: fieldErrorsIn(fetcher.data),
  });
}
