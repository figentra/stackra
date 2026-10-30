/**
 * Stackra file contract:
 * Purpose: proves the web FormErrorSummary draws nothing without errors, titles itself by the count, takes focus when
 *          it appears, links each error to its field (by id, then by name) and focuses that field when followed, and
 *          lists a schema form's own field errors when given none.
 * Boundary: jsdom with real HeroUI and react-hook-form; scrolling is a stub, as jsdom has no layout.
 * Runtime: browser
 * Governing contract: ADR 0022 (test placement); ADR 0055 (forms); STA-1371.
 */
// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { type ReactElement, useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";

import { FormErrorSummary } from "#react/form-error-summary/form-error-summary";

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

const ERRORS = [
  { field: "email", label: "Email", message: "Enter an email address" },
  { field: "phone", message: "Enter a phone number" },
];

/** A schema-like form whose `email` field has an error. */
function FormWithError(): ReactElement {
  const form = useForm<{ email: string }>();
  useEffect(() => {
    form.setError("email", { message: "Email is required" });
  }, [form]);
  return (
    <FormProvider {...form}>
      <FormErrorSummary />
    </FormProvider>
  );
}

describe("FormErrorSummary (web)", () => {
  it("draws nothing without errors", () => {
    const { container } = render(<FormErrorSummary errors={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it("is titled by the count, focused when it appears, and links each error to its field", () => {
    const onSelectError = vi.fn();
    render(
      <>
        <FormErrorSummary errors={ERRORS} onSelectError={onSelectError} />
        <input id="email" aria-label="Email" />
        <input name="phone" aria-label="Phone" />
      </>,
    );
    expect(screen.getByText("There are 2 problems")).toBeTruthy();
    expect(document.activeElement?.getAttribute("data-slot")).toBe("form-error-summary");
    const email = screen.getByRole("link", { name: "Email: Enter an email address" });
    expect(email.getAttribute("href")).toBe("#email");
    fireEvent.click(email);
    expect(document.activeElement).toBe(screen.getByLabelText("Email"));
    fireEvent.click(screen.getByRole("link", { name: "Enter a phone number" }));
    expect(document.activeElement).toBe(screen.getByLabelText("Phone"));
    expect(onSelectError).toHaveBeenLastCalledWith("phone");
  });

  it("lists a schema form's field errors when given none", async () => {
    render(<FormWithError />);
    await waitFor(() =>
      expect(screen.getByRole("link", { name: "Email is required" })).toBeTruthy(),
    );
    expect(screen.getByText("There is 1 problem")).toBeTruthy();
  });
});
