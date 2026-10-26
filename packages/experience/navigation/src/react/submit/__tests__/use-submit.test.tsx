/**
 * Stackra file contract:
 * Purpose: unit tests of `useSubmit`: calling it posts the values as JSON to the page's own route action, `isPending`
 *          follows the post, and the answer's `data` and `fieldErrors` come back.
 * Boundary: test only; jsdom with a memory data router whose route action records the posted body.
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0022; ADR 0165 (form adapters); ADR 0140.
 */
// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { useEffect } from "react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { vi } from "vitest";

import { Route } from "#core/bases/route.base";
import { useSubmit } from "#react/submit/use-submit";

class SettingsRoute extends Route({ path: "/settings" }) {
  override submit() {
    return { fieldErrors: { cutoff: "settings_locked" } };
  }
}

/** The submit handle of the settings route. */
type Submit = ReturnType<typeof useSubmit<typeof SettingsRoute>>;

/** Hands the submit handle to `onReady` and shows its state. */
function Probe({ onReady }: { readonly onReady: (submit: Submit) => void }) {
  const submit = useSubmit<typeof SettingsRoute>();
  useEffect(() => onReady(submit));
  return <p>{submit.fieldErrors["cutoff"] ?? (submit.isPending ? "pending" : "idle")}</p>;
}

afterEach(() => {
  cleanup();
});

describe("useSubmit", () => {
  it("posts JSON to the page's route and reads the answer back", async () => {
    const action = vi.fn(async ({ request }: { request: Request }) => {
      expect(await request.json()).toEqual({ cutoff: 30 });
      return { fieldErrors: { cutoff: "settings_locked" } };
    });
    let submit = (() => Promise.resolve()) as unknown as Submit;
    const keep = (next: Submit) => {
      submit = next;
    };
    const router = createMemoryRouter(
      [{ path: "/settings", element: <Probe onReady={keep} />, action }],
      {
        initialEntries: ["/settings"],
      },
    );
    render(<RouterProvider router={router} />);
    expect(screen.getByText("idle")).toBeTruthy();
    await act(() => submit({ cutoff: 30 }));
    await waitFor(() => expect(screen.getByText("settings_locked")).toBeTruthy());
    expect(action).toHaveBeenCalledOnce();
    expect(submit.data).toEqual({ fieldErrors: { cutoff: "settings_locked" } });
  });
});
